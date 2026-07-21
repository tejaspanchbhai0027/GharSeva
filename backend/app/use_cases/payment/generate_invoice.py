import io
from uuid import UUID
from typing import Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

from app.domain.protocols.payment_repo import PaymentRepository
from app.domain.protocols.booking_repo import BookingRepository
from app.adapters.database.sqlalchemy_models import User


class GenerateInvoiceUseCase:
    def __init__(self, payment_repo: PaymentRepository, booking_repo: BookingRepository):
        self.payment_repo = payment_repo
        self.booking_repo = booking_repo

    def execute(self, booking_id_str: str, current_user: User) -> bytes:
        booking_id = UUID(booking_id_str)

        payment = self.payment_repo.get_payment_by_booking_id(booking_id)
        if not payment:
            raise ValueError("No payment found for this booking.")
        if payment.status != "captured":
            raise ValueError("Invoice is only available for completed payments.")

        booking = self.booking_repo.get_booking_by_id(booking_id)
        if not booking:
            raise ValueError("Booking not found.")

        # Authorization: only the customer of the booking or an admin can download
        if current_user.role == "customer" and booking.customer_id != current_user.user_id:
            raise ValueError("You are not authorized to download this invoice.")

        return self._generate_pdf(payment, booking, current_user)

    def _generate_pdf(self, payment, booking, user) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=20 * mm,
            leftMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm
        )

        styles = getSampleStyleSheet()
        brand_color = colors.HexColor("#F59E0B")  # GharSeva amber

        title_style = ParagraphStyle(
            "Title", parent=styles["Heading1"],
            fontSize=22, textColor=brand_color,
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            "Subtitle", parent=styles["Normal"],
            fontSize=10, textColor=colors.HexColor("#94a3b8")
        )
        label_style = ParagraphStyle(
            "Label", parent=styles["Normal"],
            fontSize=9, textColor=colors.HexColor("#64748b")
        )
        value_style = ParagraphStyle(
            "Value", parent=styles["Normal"],
            fontSize=10, textColor=colors.HexColor("#1e293b"), fontName="Helvetica-Bold"
        )
        right_style = ParagraphStyle(
            "Right", parent=styles["Normal"],
            fontSize=10, alignment=TA_RIGHT
        )

        story = []

        # Header
        story.append(Paragraph("GharSeva", title_style))
        story.append(Paragraph("Home Services Platform • gharseva.com", subtitle_style))
        story.append(Spacer(1, 6 * mm))
        story.append(HRFlowable(width="100%", thickness=2, color=brand_color, spaceAfter=6 * mm))

        # Title row
        story.append(Paragraph("<b>TAX INVOICE</b>", ParagraphStyle(
            "InvoiceTitle", parent=styles["Heading2"], fontSize=16,
            textColor=colors.HexColor("#0f172a"), spaceAfter=2
        )))
        story.append(Paragraph(
            f"Invoice #: <b>INV-{str(payment.payment_id)[:8].upper()}</b>",
            subtitle_style
        ))
        story.append(Spacer(1, 5 * mm))

        # Billed To / Payment Info table
        info_data = [
            [Paragraph("<b>Billed To</b>", value_style), Paragraph("<b>Payment Details</b>", value_style)],
            [
                Paragraph(user.full_name or "Customer", styles["Normal"]),
                Paragraph(f"Date: {payment.created_at.strftime('%d %b %Y')}", styles["Normal"])
            ],
            [
                Paragraph(user.email, styles["Normal"]),
                Paragraph(f"Transaction ID: {payment.transaction_reference[:20]}...", styles["Normal"])
            ],
            [
                Paragraph(user.phone or "—", styles["Normal"]),
                Paragraph(f"Status: <font color='#22c55e'><b>PAID</b></font>", styles["Normal"])
            ],
        ]
        info_table = Table(info_data, colWidths=[85 * mm, 85 * mm])
        info_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 6 * mm))

        # Items table
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=4 * mm))
        items_data = [
            ["Description", "Booking ID", "Amount (INR)"],
            [
                "Professional Home Service",
                str(booking.booking_id)[:18] + "...",
                f"₹ {float(booking.total_amount):,.2f}"
            ],
        ]
        items_table = Table(items_data, colWidths=[90 * mm, 55 * mm, 25 * mm])
        items_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("ALIGN", (2, 0), (2, -1), "RIGHT"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 4 * mm))

        # Total
        total_data = [
            ["", "Subtotal", f"₹ {float(payment.amount):,.2f}"],
            ["", "Tax (0%)", "₹ 0.00"],
            ["", Paragraph("<b>Total Paid</b>", value_style), Paragraph(f"<b>₹ {float(payment.amount):,.2f}</b>", value_style)],
        ]
        total_table = Table(total_data, colWidths=[90 * mm, 55 * mm, 25 * mm])
        total_table.setStyle(TableStyle([
            ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
            ("LINEABOVE", (1, 2), (-1, 2), 1, colors.HexColor("#94a3b8")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(total_table)
        story.append(Spacer(1, 10 * mm))

        # Footer
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=4 * mm))
        story.append(Paragraph(
            "Thank you for choosing GharSeva. This is a computer-generated invoice and does not require a signature.",
            ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8,
                           textColor=colors.HexColor("#94a3b8"), alignment=TA_CENTER)
        ))

        doc.build(story)
        return buffer.getvalue()
