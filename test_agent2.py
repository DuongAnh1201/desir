import asyncio
import sys
import os
from unittest.mock import MagicMock

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

try:
    from ai.agents.agent2 import get_calendar_agent
    from ai.agents.deps import OrchestratorDeps
    from schemas.agent2 import CalendarResult
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

async def run_test_case(prompt: str):
    print(f"\n--- TEST CASE: {prompt} ---")
    agent = get_calendar_agent()
    mock_deps = MagicMock(spec=OrchestratorDeps)
    
    try:
        result = await agent.run(prompt, deps=mock_deps)
        output = result.output
        
        if output:
            print(f"Complete")
            print(f"   - Title: {getattr(output, 'title', 'N/A')}")
            print(f"   - Start: {getattr(output, 'start', 'N/A')}")
            print(f"   - Description: {getattr(output, 'description', 'N/A')}")
        else:
            print(f"  Agent Response rỗng. Kiểm tra lại logic prompt.")
            
    except Exception as e:
        print(f"Error during execution: {e}")

async def main():
    test_prompts = [
        "Make an appointment at Tuesday 9am ",
        "Recall me to go to work at Monday 8am",
        "Make a simple task for housework at Sunday 7pm"
    ]
    
    for p in test_prompts:
        await run_test_case(p)

if __name__ == "__main__":
    asyncio.run(main())