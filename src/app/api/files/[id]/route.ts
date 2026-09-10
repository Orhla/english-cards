import {requireLogin} from "@/lib/dal";
import {prisma} from "@/lib/prisma";
import {AUDIO_DIR, audioMimeToExt, IMAGE_DIR} from "@/lib/consts";
import path from "path";
import { getProvider, readStreamFromStorage } from "@/services/storage";

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
    })

    if (!fileMeta) {
        return new Response("Not Found", { status: 404 })
    }

    // const provider = getProvider()

    // if (provider.getSignedUrl) {
    //     const url = await provider.getSignedUrl(fileMeta.path)
    //     return Response.redirect(url, 302)
    // }

    let stream = null;
    if (fileMeta.mimeType in audioMimeToExt) {
        stream = await readStreamFromStorage(path.join(AUDIO_DIR, fileMeta.path))
    }
    else {
        stream = await readStreamFromStorage(path.join(IMAGE_DIR, fileMeta.path))
    }    

    const encodedName = encodeURIComponent(fileMeta.originalName).replace(/[!*'()]/g, '-');
    return new Response(stream, {
        headers: {
            "Content-Type": fileMeta.mimeType,
            "Content-Disposition": `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`
        },
    })
}
