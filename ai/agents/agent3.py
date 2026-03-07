"""Google Search sub-agent."""
import httpx
from pydantic_ai import Agent, RunContext

from ai.prompts import load_prompt
from ai.agents.deps import OrchestratorDeps
from schemas.agent3 import SearchResult

_search_agent: Agent | None = None


def get_search_agent() -> Agent:
    global _search_agent
    if _search_agent is None:
        from config import settings

        _search_agent = Agent(
            model=settings.ai_model,
            name="search_agent",
            system_prompt=load_prompt("search_agent"),
            result_type=SearchResult,
            deps_type=OrchestratorDeps,
        )

        @_search_agent.tool
        async def search_web(ctx: RunContext[OrchestratorDeps], query: str) -> list[dict]:
            """Live web search via Serper API."""
            if not ctx.deps.search_api_key:
                return []
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://google.serper.dev/search",
                        headers={"X-API-KEY": ctx.deps.search_api_key},
                        json={"q": query, "num": 10},
                    )
                    resp.raise_for_status()
                    return resp.json().get("organic", [])
            except httpx.HTTPStatusError as e:
                raise RuntimeError(
                    f"Serper API error {e.response.status_code}: {e.response.text}"
                ) from e
            except httpx.RequestError as e:
                raise RuntimeError(f"Serper API request failed: {e}") from e

    return _search_agent
