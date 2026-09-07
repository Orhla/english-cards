// import { auth } from "@/auth"
// import { readFile } from "fs/promises"
// import { join, basename } from "path"
import {requireLogin} from "@/lib/dal";
import {prisma} from "@/lib/prisma";
import {readFromStorage} from "@/services/file-storage";
import {AUDIO_DIR, audioMimeToExt, IMAGE_DIR} from "@/lib/consts";
import path from "path";

export async function GET(
    _req: Request,
    ctx: RouteContext<"/api/files/[id]">
) {

    const { id } = await ctx.params
    const session = await requireLogin()
    console.log(`File id: ${id} download endpoint triggered with session:`, session)
    if (!session) {
        return new Response("Unauthorized", { status: 401 })
    }

    const fileMeta = await  prisma.file.findUnique({
        where: { id },
        // select: { id: true, filename: true, userId: true }
    })

    if (!fileMeta) {
        return new Response("Not Found", { status: 404 })
    }
    console.log("fileMeta", fileMeta)

    let fileBytes = null;
    if (fileMeta.mimeType in audioMimeToExt) {
        fileBytes = await readFromStorage(path.join(AUDIO_DIR, fileMeta.path))
    }
    else {
        fileBytes = await readFromStorage(path.join(IMAGE_DIR, fileMeta.path))
    }

    console.log("bytes", !!fileBytes)
    const encodedName = encodeURIComponent(fileMeta.originalName).replace(/[!*'()]/g, '-');
    return new Response(new Uint8Array(fileBytes), {
        headers: {
            "Content-Type": fileMeta.mimeType,
            "Content-Disposition": `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`
        },
    })
}
