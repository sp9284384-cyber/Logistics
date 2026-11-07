import logging
import smtplib
from datetime import datetime
from email.message import EmailMessage
from typing import Any, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def notify_new_booking(ref_code: str, contact: str, phone: str) -> None:
    settings = get_settings()
    subject = f"New booking request {ref_code} — {contact}"
    body = f"Ref: {ref_code}\nContact: {contact}\nPhone: {phone}"

    sender = settings.SMTP_USER or "ganrajlogisticsservice@gmail.com"
    target = settings.NOTIFY_EMAIL or "ganrajlogisticsservice@gmail.com"
    smtp_pass = (settings.SMTP_PASSWORD or "").replace(" ", "").strip()

    if settings.SMTP_HOST:
        try:
            msg = EmailMessage()
            msg["From"] = f"Ganraj Logistics Service <{sender}>"
            msg["To"] = target
            msg["Reply-To"] = "ganrajlogisticsservice@gmail.com"
            msg["Subject"] = subject
            msg.set_content(body)
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
                smtp.starttls()
                if smtp_pass:
                    smtp.login(sender, smtp_pass)
                smtp.send_message(msg)
        except Exception:
            logger.exception("email notification failed for %s", ref_code)

    if settings.WHATSAPP_API_URL and settings.WHATSAPP_API_TOKEN:
        try:
            httpx.post(
                settings.WHATSAPP_API_URL,
                headers={"Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}"},
                json={"text": f"{subject}\n{body}"},
                timeout=10,
            )
        except Exception:
            logger.exception("whatsapp notification failed for %s", ref_code)


def send_invoice_email(
    booking: Any,
    total_amount: float,
    advance_amount: Optional[float] = None,
    tax_percent: Optional[float] = 18.0,
    notes: Optional[str] = None,
    payment_terms: Optional[str] = None,
) -> dict[str, Any]:
    settings = get_settings()
    customer_email = getattr(booking, "email", None)
    customer_name = getattr(booking, "contact_person", None) or getattr(booking, "company_name", "Valued Customer")
    ref_code = getattr(booking, "ref_code", "GLS")
    pickup = getattr(booking, "pickup_city", "Origin")
    delivery = getattr(booking, "delivery_city", "Destination")
    vehicle = getattr(booking, "vehicle_type", "Standard Truck")
    material = getattr(booking, "material", "General Cargo")
    date_str = datetime.now().strftime("%d %b %Y")

    subtotal = round(total_amount / (1 + (tax_percent or 0) / 100), 2) if tax_percent else total_amount
    tax_amount = round(total_amount - subtotal, 2) if tax_percent else 0.0

    subject = f"Invoice / Transport Quotation {ref_code} — Ganraj Logistics Service"

    # Clean HTML invoice template
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; margin: 0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }}
        .header {{ background-color: #011c42; color: #ffffff; padding: 28px 24px; text-align: left; }}
        .header h1 {{ margin: 0; font-size: 22px; letter-spacing: -0.5px; font-weight: 800; }}
        .header p {{ margin: 4px 0 0; font-size: 13px; color: #f97316; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }}
        .body {{ padding: 24px; }}
        .ref-box {{ background-color: #f8fafc; border-left: 4px solid #f97316; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0; }}
        .route {{ display: flex; align-items: center; justify-content: space-between; background: #f1f5f9; padding: 14px; border-radius: 8px; margin-bottom: 20px; }}
        .table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
        .table th {{ background: #f8fafc; text-align: left; padding: 10px; font-size: 12px; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }}
        .table td {{ padding: 12px 10px; font-size: 14px; border-bottom: 1px solid #e2e8f0; }}
        .total-row td {{ font-size: 18px; font-weight: 800; color: #011c42; border-top: 2px solid #011c42; }}
        .footer {{ background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
        .badge {{ background: #fed7aa; color: #9a3412; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: bold; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>GANRAJ LOGISTICS SERVICE</h1>
          <p>Reliable Transport. On Time. Every Time.</p>
        </div>
        <div class="body">
          <div class="ref-box">
            <table style="width:100%">
              <tr>
                <td><strong>Invoice / Quotation Ref:</strong> {ref_code}</td>
                <td style="text-align:right"><strong>Date:</strong> {date_str}</td>
              </tr>
              <tr>
                <td><strong>Customer:</strong> {customer_name}</td>
                <td style="text-align:right"><strong>Vehicle:</strong> {vehicle}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; line-height: 1.5;">Dear <strong>{customer_name}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Thank you for speaking with our logistics dispatch team. Below is the approved quotation/invoice for your transport consignment.
          </p>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align:right">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Route</strong></td>
                <td style="text-align:right">{pickup} ➔ {delivery}</td>
              </tr>
              <tr>
                <td><strong>Cargo / Material</strong></td>
                <td style="text-align:right">{material}</td>
              </tr>
              <tr>
                <td><strong>Vehicle Type</strong></td>
                <td style="text-align:right">{vehicle}</td>
              </tr>
              <tr>
                <td>Base Freight Charge</td>
                <td style="text-align:right">₹{subtotal:,.2f}</td>
              </tr>
              {f"<tr><td>GST ({tax_percent}%)</td><td style='text-align:right'>₹{tax_amount:,.2f}</td></tr>" if tax_percent else ""}
              <tr class="total-row">
                <td>TOTAL AMOUNT</td>
                <td style="text-align:right; color:#ea580c">₹{total_amount:,.2f}</td>
              </tr>
              {f"<tr><td><strong>Advance Required:</strong></td><td style='text-align:right; color:#16a34a; font-weight:bold'>₹{advance_amount:,.2f}</td></tr>" if advance_amount else ""}
            </tbody>
          </table>

          {f"<div style='margin-top:20px; background:#fff7ed; border:1px solid #fed7aa; padding:12px; border-radius:8px;'><strong style='color:#9a3412; font-size:13px;'>Terms & Notes:</strong><p style='margin:4px 0 0; font-size:13px; color:#431407;'>{notes or payment_terms}</p></div>" if notes or payment_terms else ""}

          <div style="margin-top: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; font-size: 13px;">
            <strong>Bank / Payment Details:</strong><br>
            A/C Name: Ganraj Logistics Service<br>
            UPI ID: 8108767159@upi<br>
            Contact Dispatch: <strong>+91 8108767159</strong> / <strong>+91 99870 51430</strong>
          </div>
        </div>
        <div class="footer">
          Ganraj Logistics Service • All Over India Transport Solutions<br>
          Email: <a href="mailto:ganrajlogisticsservice@gmail.com" style="color:#f97316">ganrajlogisticsservice@gmail.com</a> • Mob / WhatsApp: <strong>+91 8108767159</strong>
        </div>
      </div>
    </body>
    </html>
    """

    plain_text = f"""
GANRAJ LOGISTICS SERVICE — INVOICE / QUOTATION
Ref: {ref_code} | Date: {date_str}
Customer: {customer_name}
Route: {pickup} to {delivery}
Cargo: {material} | Vehicle: {vehicle}
TOTAL AMOUNT: Rs. {total_amount:,.2f}
{f"Advance: Rs. {advance_amount:,.2f}" if advance_amount else ""}
Terms: {notes or payment_terms or "Standard transport terms apply"}
Payment: UPI 8108767159@upi / Call +91 8108767159
Email: ganrajlogisticsservice@gmail.com
    """.strip()

    email_sent = False
    delivery_note = "Simulated (Configure SMTP_PASSWORD in backend/.env for live Gmail dispatch)"

    sender = settings.SMTP_USER or "ganrajlogisticsservice@gmail.com"
    smtp_pass = (settings.SMTP_PASSWORD or "").replace(" ", "").strip()

    if customer_email and settings.SMTP_HOST and smtp_pass:
        try:
            msg = EmailMessage()
            msg["From"] = f"Ganraj Logistics Service <{sender}>"
            msg["To"] = customer_email
            msg["Reply-To"] = "ganrajlogisticsservice@gmail.com"
            msg["Subject"] = subject
            msg.set_content(plain_text)
            msg.add_alternative(html_content, subtype="html")

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
                smtp.starttls()
                smtp.login(sender, smtp_pass)
                smtp.send_message(msg)
            email_sent = True
            delivery_note = f"Sent from {sender} to {customer_email}"
        except Exception as e:
            logger.warning("SMTP email dispatch failed: %s", e)
            delivery_note = f"SMTP error: {str(e)[:100]}"
    elif customer_email:
        delivery_note = f"Dispatched from {sender} to {customer_email} (Demo/Simulated Mode)"

    # Formatted WhatsApp message link for one-click admin sharing
    adv_line = f"💵 Advance: ₹{advance_amount:,.2f}\n" if advance_amount else ""
    terms_line = notes or payment_terms or "Safe transport & on-time pickup"
    wa_text = (
        f"Hello {customer_name},\n"
        f"Greetings from *Ganraj Logistics Service*.\n\n"
        f"📋 Transport Quotation / Invoice for Ref *{ref_code}*:\n"
        f"📍 Route: {pickup} ➔ {delivery}\n"
        f"🚛 Vehicle: {vehicle}\n"
        f"📦 Material: {material}\n"
        f"💰 *Total Amount: ₹{total_amount:,.2f}*\n"
        f"{adv_line}"
        f"📝 Terms: {terms_line}\n"
        f"🏦 UPI / Bank: 8108767159@upi\n"
        f"📞 Dispatch Helpline: +91 8108767159\n"
        f"📧 Email: ganrajlogisticsservice@gmail.com\n\n"
        f"Please confirm to dispatch the vehicle. Thank you!"
    )

    return {
        "success": True,
        "email_sent": email_sent,
        "recipient": customer_email,
        "delivery_note": delivery_note,
        "total_amount": total_amount,
        "whatsapp_text": wa_text,
        "plain_text": plain_text,
    }
