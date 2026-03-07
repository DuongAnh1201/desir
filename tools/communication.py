"""
macOS communication tools — iMessage and phone calls.

iMessage: uses osascript to send via the Messages app.
Phone call: opens the tel:// URI which triggers FaceTime or the default call handler.
"""

import subprocess


def send_imessage(recipient: str, body: str) -> bool:
    """Send an iMessage to a phone number or Apple ID."""
    script = f"""
    tell application "Messages"
        set targetService to 1st account whose service type = iMessage
        set targetBuddy to participant "{recipient}" of targetService
        send "{body}" to targetBuddy
    end tell
    """
    try:
        subprocess.run(["osascript", "-e", script], check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"iMessage error: {e.stderr.decode()}")
        return False


def search_contact(name: str) -> list[dict]:
    """
    Search macOS Contacts for people matching `name`.
    Returns a list of dicts with 'name' and 'phone' keys.
    """
    script = f"""
    set results to {{}}
    tell application "Contacts"
        set matchedPeople to (every person whose name contains "{name}")
        repeat with p in matchedPeople
            set personName to name of p
            set phones to phone of p
            repeat with ph in phones
                set end of results to (personName & "|" & (value of ph))
            end repeat
        end repeat
    end tell
    set AppleScript's text item delimiters to linefeed
    return results as text
    """
    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            check=True,
            capture_output=True,
            text=True,
        )
        contacts = []
        for line in result.stdout.strip().splitlines():
            if "|" in line:
                contact_name, phone = line.split("|", 1)
                contacts.append({"name": contact_name.strip(), "phone": phone.strip()})
        return contacts
    except subprocess.CalledProcessError as e:
        print(f"Contacts search error: {e.stderr}")
        return []


def make_call(recipient: str) -> bool:
    """Initiate a phone call via the tel:// URI (opens FaceTime or default handler)."""
    # Strip spaces/dashes for a clean tel URI
    number = recipient.replace(" ", "").replace("-", "")
    try:
        subprocess.run(["open", f"tel://{number}"], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Call error: {e}")
        return False
