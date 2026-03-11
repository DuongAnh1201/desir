import resend
from config import settings
from schemas.agent1 import NotificationEmailRequest
def _get_client(api_key: str = "") -> None:
    resend.api_key = api_key or settings.resend_api_key


def add_domain(domain_name: str) -> dict:
    """Register a domain with Resend and return the DNS records to configure."""
    _get_client()
    params: resend.Domains.CreateParams = {"name": domain_name}
    domain = resend.Domains.create(params)
    return domain


def send_notification_email(arg: NotificationEmailRequest) -> str:
    """Send a styled HTML notification email via Resend. Returns 'ok' or an error message."""
    _get_client(arg.api_key)
    html = _build_notification_html(arg.details, arg.link, arg.sender_name)
    payload = {
        "from": arg.from_address,
        "to": [arg.recipient],
        "subject": arg.subject,
        "html": html,
    }
    if arg.scheduleAt:
        payload["scheduleAt"] = arg.scheduleAt
    try:
        resend.Emails.send(payload)
        return "ok"
    except Exception as e:
        return str(e)


def send_user_email(
    recipient: str,
    subject: str,
    body: str,
    api_key: str = "",
    from_address: str = "Desir <onboarding@resend.dev>",
) -> str:
    """Send a plain-text email via Resend. Returns 'ok' or an error message."""
    _get_client(api_key)
    try:
        resend.Emails.send({
            "from": from_address,
            "to": [recipient],
            "subject": subject,
            "text": body,
        })
        return "ok"
    except Exception as e:
        return str(e)


def _build_notification_html(details: str, link: str, sender_name: str) -> str:
    link_button = (
        f"""<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
                  <tr>
                    <td align="center" style="border-radius:4px; background-color:#1a73e8;">
                      <a href="{link}" style="display:inline-block; padding:12px 20px; font-size:15px; color:#ffffff; text-decoration:none; font-weight:bold;">
                        View Details
                      </a>
                    </td>
                  </tr>
                </table>"""
        if link
        else ""
    )

    return f"""<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f4f4f7; font-family:Arial, sans-serif; color:#333333;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f7; padding:30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">

            <tr>
              <td style="background-color:#1a73e8; padding:20px; text-align:center;">
                <h1 style="margin:0; font-size:24px; color:#ffffff;">Notification</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:30px 40px;">
                <p style="margin:0 0 16px; font-size:16px;">Hello,</p>

                <p style="margin:0 0 16px; font-size:16px; line-height:1.6;">
                  {details}
                </p>

                <p style="margin:0 0 16px; font-size:16px; line-height:1.6;">
                  Please review the information and take any necessary action if needed.
                </p>

                {link_button}

                <p style="margin:0 0 8px; font-size:16px;">Best regards,</p>
                <p style="margin:0; font-size:16px;">{sender_name}</p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 40px; background-color:#f0f2f5; font-size:12px; color:#777777; text-align:center;">
                This is an automated notification email. Please do not reply directly to this message.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""
