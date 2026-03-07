import smtplib
from email.message import EmailMessage

_SMTP_HOST = "smtp.gmail.com"
_SMTP_PORT = 587
_USERNAME = "tomnguyen6766@gmail.com"
_SENDER = "tomnguyen6766@gmail.com"


def _send(recipient: str, subject: str, body: str, html: bool, password: str) -> bool:
    msg = EmailMessage()
    msg["From"] = _SENDER
    msg["To"] = recipient
    msg["Subject"] = subject
    if html:
        msg.add_alternative(body, subtype="html")
    else:
        msg.set_content(body)

    try:
        with smtplib.SMTP(_SMTP_HOST, _SMTP_PORT, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(_USERNAME, password)
            server.send_message(msg)
        return True
    except smtplib.SMTPException as e:
        print(f"SMTP error: {e}")
        return False
    except Exception as e:
        print(f"General error: {e}")
        return False


def send_notification_email(
    recipient: str,
    subject: str,
    details: str,
    link: str = "",
    sender_name: str = "Desir",
    password: str = "",
) -> bool:
    """
    Send a styled HTML notification email.
    `details`, `link`, and `sender_name` are AI-generated at call time.
    """
    body = _build_notification_html(details, link, sender_name)
    return _send(recipient, subject, body, html=True, password=password)


def send_user_email(
    recipient: str,
    subject: str,
    body: str,
    password: str = "",
) -> bool:
    """
    Send a plain-text email composed by the AI on behalf of the user.
    """
    return _send(recipient, subject, body, html=False, password=password)


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
