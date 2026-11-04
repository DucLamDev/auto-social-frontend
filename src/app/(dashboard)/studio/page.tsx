import { redirect } from "next/navigation";
// Studio only works on one library item, so the bare URL (old menu link, bookmarks) goes to the library.
export default function StudioPage() { redirect("/contents"); }
