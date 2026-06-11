import logging
from django.core.mail.backends.smtp import EmailBackend as SmtpEmailBackend
from django.core.mail.backends.console import EmailBackend as ConsoleEmailBackend

logger = logging.getLogger(__name__)

class HybridEmailBackend(SmtpEmailBackend):
    def __init__(self, *args, **kwargs):
        # Default connection timeout to 5 seconds to avoid long hangs on blockages
        if 'timeout' not in kwargs:
            kwargs['timeout'] = 5
        super().__init__(*args, **kwargs)

    def send_messages(self, email_messages):
        try:
            return super().send_messages(email_messages)
        except Exception as e:
            print(f"\n[EMAIL SMTP WARNING] SMTP connection failed, outputting to console instead. Error: {e}")
            logger.warning(f"SMTP connection failed: {e}. Falling back to console email backend.")
            try:
                console_backend = ConsoleEmailBackend()
                return console_backend.send_messages(email_messages)
            except Exception as console_err:
                print(f"[EMAIL ERROR] Console fallback failed: {console_err}")
                return 0
