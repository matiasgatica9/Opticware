import { redirect } from "next/navigation"

export default function NewSalePage() {
  redirect("/invoicing/new?from=sales")
}
