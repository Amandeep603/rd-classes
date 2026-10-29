import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Enquiry } from "@/lib/models/Enquiry";

export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    await connectDB();
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return Response.json({ error: "Enquiry not found" }, { status: 404 });
    }

    if (body.status !== undefined) {
      if (!["new", "contacted", "enrolled", "closed"].includes(body.status)) {
        return Response.json({ error: "Invalid status" }, { status: 400 });
      }
      enquiry.status = body.status;
    }

    if (body.note !== undefined) {
      enquiry.note = (body.note || "").trim();
    }

    await enquiry.save();
    return Response.json({ success: true, enquiry });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;

    await connectDB();
    await Enquiry.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

