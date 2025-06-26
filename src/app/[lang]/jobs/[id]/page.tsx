import Header from "@/components/Header";
import { use } from "react";
import JobPageClient from "./ClientComponent";

export default function JobPage({params, children}: {params: Promise<{lang: string, id: string}>, children: React.ReactNode}) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const lang = resolvedParams.lang;
    return <div>
        <Header lang={lang} />
        <JobPageClient id={id} />
    </div>
}