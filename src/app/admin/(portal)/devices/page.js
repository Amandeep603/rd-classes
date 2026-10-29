import { redirect } from "next/navigation";

export default function AdminDevicesRedirect() {
  redirect("/admin/device-requests");
}
