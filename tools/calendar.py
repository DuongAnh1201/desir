
from schemas.agent2 import CalendarRequest
#Connect to your apple calendar (run on MacOS only)
import subprocess
import os
env = os.environ.copy()


def calendars() -> str:
    try:
        result = subprocess.run(
            ["accli", "calendars", "--json"],
            check=True,
            text=True,
            capture_output=True,
            env=env,
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise RuntimeError(e.stderr.strip() or e.stdout.strip() or str(e)) from e


def create_calendar_event(arg: CalendarRequest) -> str:
    start_str = arg.start.strftime("%Y-%m-%dT%H:%M:%S")
    end_str = arg.end.strftime("%Y-%m-%dT%H:%M:%S")
    cmd = ["accli", "create", arg.calendarName, "--summary", arg.title, "--start", start_str, "--end", end_str]
    if arg.description:
        cmd += ["--notes", arg.description]
    try:
        result = subprocess.run(cmd, check=True, text=True, capture_output=True, env=env)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise RuntimeError(e.stderr.strip() or e.stdout.strip() or str(e)) from e

def create_calendar_update(arg: CalendarRequest) ->str:
    id = arg.id
    calendar_name = arg.calendarName
    cmd = ["accli", "update", calendar_name, id, "--json"]
    try:
        result = subprocess.run(cmd, check=True, text=True, capture_output=True, env=env)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise RuntimeError(e.stderr.strip() or e.stdout.strip() or str(e)) from e

def create_calendar_delete(arg: CalendarRequest) ->str:
    id = arg.id
    calendar_name = arg.calendarName
    cmd = ["accli", "delete", calendar_name, id, "--json"]
    try:
        result = subprocess.run(cmd, check=True, text=True, capture_output=True, env=env)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise RuntimeError(e.stderr.strip() or e.stdout.strip() or str(e)) from e

def freebusy_check(arg: CalendarRequest) ->str:
    calendar_name = arg.calendarName
    starttime = arg.start.strftime("%Y-%m-%dT%H:%M:%S")
    endtime = arg.end.strftime("%Y-%m-%dT%H:%M:%S")
    cmd = ["accli", "freebusy", "--calendar", calendar_name, "--from", starttime, "--to", endtime, "--json"]
    try:
        result = subprocess.run(cmd, check=True, text=True, capture_output=True, env=env)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise RuntimeError(e.stderr.strip() or e.stdout.strip() or str(e)) from e
if __name__ == "__main__":
    print(calendars())

    # Quick test for create_calendar_event
    from datetime import datetime
    from unittest.mock import patch, MagicMock

    req = CalendarRequest(
        calendarName="tomnguyen6766@gmail.com",
        title="Test Event",
        start=datetime(2026, 3, 10, 9, 0, 0),
        end=datetime(2026, 3, 10, 10, 0, 0),
        description="Test description",
    )
    mock = MagicMock()
    mock.stdout = "Event created.\n"
    with patch("subprocess.run", return_value=mock) as p:
        out = create_calendar_event(req)
        cmd = p.call_args[0][0]
        assert cmd[cmd.index("--summary") + 1] == "Test Event"
        assert cmd[cmd.index("--start") + 1] == "2026-03-10T09:00:00"
        assert cmd[cmd.index("--notes") + 1] == "Test description"
        assert out == "Event created."
        print("create_calendar_event test passed.")