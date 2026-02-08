import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).with_name(".env"))

from typing import TypedDict, Optional, Annotated

from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from tools import (
    extract_text,
    preprocess_image,
)


class AgentState(TypedDict, total=False):
    input_file: Optional[str]
    messages: Annotated[list[AnyMessage], add_messages]

tools = [extract_text, preprocess_image]

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",   # or gemini-2.5-pro
    temperature=0,
    max_output_tokens=800,
    api_key=os.getenv("GEMINI_API_KEY"),
)
llm_with_tools = llm.bind_tools(tools)


def assistant(state: AgentState):
    TOOL_DESC = """
    def extract_text(img_path: str) -> str: Extracts text from an image.
    def preprocess_image(img_path: str, op: str = "threshold", target_width: int = 1600) -> str: Preprocesses image for OCR.
    """
    image = state.get("input_file")

    sys_msg = SystemMessage(content=(
        "You are a helpful assistant.\n\n"
        "You can analyze documents with these tools:\n"
        f"{TOOL_DESC}\n"
        f"The current image path is: {image!r}.\n"
        "Do this plan:\n"
        "  1) Call preprocess_image(img_path=<that exact path>, op='threshold').\n"
        "  2) Call extract_text(img_path=<path returned by step 1>). \n"
        "Return ONLY the extracted text. Never invent a filename."
    ))

    return {
        "messages": [llm_with_tools.invoke([sys_msg] + state.get("messages", []))],
        "input_file": image,
    }


builder = StateGraph(AgentState)
builder.add_node("assistant", assistant)
builder.add_node("tools", ToolNode(tools))

builder.add_edge(START, "assistant")
builder.add_conditional_edges("assistant", tools_condition)
builder.add_edge("tools", "assistant")

react_graph = builder.compile()

from pathlib import Path
from langchain_core.messages import HumanMessage

def run_ocr_agent_on_path(img_path: str) -> str:
    """Run preprocess -> OCR tools via the agent and return extracted text."""
    p = Path(img_path).expanduser().resolve()
    if not p.is_file():
        raise ValueError(f"Image path not found: {p}")

    start_msgs = [
        HumanMessage(content="Preprocess with threshold and extract all readable text. Return only the text.")
    ]

    result = react_graph.invoke({
        "messages": start_msgs,
        "input_file": str(p),
    })

    return (result["messages"][-1].content or "").strip()


if __name__ == "__main__":
    # Build a robust image path relative to this file (repo-root/images/shopping_list.png)
    repo_root = Path(__file__).resolve().parent
    img_path = (repo_root / "images" / "headphones.jpg").resolve()

    user_prompt = (
        "Please preprocess the image with thresholding to improve readability, "
        "and transcribe the provided image."
    )
    start_msgs = [HumanMessage(content=user_prompt)]

    result = react_graph.invoke({
        "messages": start_msgs,
        "input_file": str(img_path),
    })

    # Debug: show the conversation and the final assistant text
    print("\n=== Conversation ===")
    for i, m in enumerate(result["messages"], 1):
        role = getattr(m, "type", getattr(m, "role", "msg"))
        print(f"{i:02d} [{role}]: {getattr(m, 'content', m)}")

    print("\n=== Assistant ===")
    print(result["messages"][-1].content)
