import os
from twilio.rest import Client

# Load Twilio credentials from environment variables
TWILIO_SID = os.getenv("TWILIO_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE = os.getenv("TWILIO_PHONE")

# Enable real SMS only if all credentials exist
sms_enabled = all([TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE])


def send_alerts(name: str, phone: str, contacts: list, location: dict):
    """
    Sends SOS alerts via Twilio if configured.
    Otherwise, simulates sending by printing messages to the console.
    """

    msg = (
        f"SOS ALERT\n"
        f"{name} ({phone}) may be in danger.\n"
        f"Location: https://maps.google.com/?q={location['lat']},{location['lng']}"
    )

    if sms_enabled:
        try:
            client = Client(TWILIO_SID, TWILIO_TOKEN)
            for contact in contacts:
                message = client.messages.create(
                    body=msg,
                    from_=TWILIO_PHONE,
                    to=contact
                )
                print(f"SMS sent to {contact} (SID: {message.sid})")
        except Exception as e:
            print(f"Error sending SMS via Twilio: {e}")
    else:
        # Simulate sending SMS when Twilio credentials are missing
        print("[SIMULATION MODE] Twilio not configured.")
        for contact in contacts:
            print(f"Simulated SMS to {contact}: {msg}")
