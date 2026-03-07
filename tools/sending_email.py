import smtplib
from email.message import EmailMessage

def send_email(
    smtp_host: str="smtp.gmail.com",
    smtp_port: int=587,
    username: str="tomnguyen6766@gmail.com",
    password: str="Namdinh@123",
    sender: str="tomnguyen6766@gmail.com",
    recipient: str="",
    subject: str="",
    body: str="",
) -> bool:
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(username, password)
            server.send_message(msg)
        return True
    except smtplib.SMTPException as e:
        print(f"SMTP error: {e}")
        return False
    except Exception as e:
        print(f"General error: {e}")
        return False