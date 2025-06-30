import Header from "@/components/Header";
import { use } from "react";
import JobPageClient from "./ClientComponent";

export default function JobPage({params}: {params: Promise<{lang: string, id: string}>}) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const lang = resolvedParams.lang;
    return <div>
        <Header lang={lang} />
        <JobPageClient id={id} />
    </div>
}