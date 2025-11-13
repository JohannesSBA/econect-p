import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import bcrypt from "bcryptjs";



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function chatHrefConstructor(
    id1: string | undefined,
    id2: string | undefined
) {
    if (id1 === undefined || id2 === undefined) {
        return;
    }
    const sortedIds = [id1, id2].sort();
    return `${sortedIds[0]}--${sortedIds[1]}`;
}



export default async function hashPassword(unHashPass: string) {
    return await bcrypt.hash(unHashPass, 10).then(function (hash: string) {
        return hash;
    });
}
