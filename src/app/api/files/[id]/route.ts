import {requireLogin} from "@/lib/dal";
import {prisma} from "@/lib/prisma";
import {AUDIO_DIR, audioMimeToExt, IMAGE_DIR} from "@/lib/consts";
import path from "path";
import { readStreamFromStorage } from "@/services/storage";

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

    const dir = fileMeta.mimeType in audioMimeToExt ? AUDIO_DIR : IMAGE_DIR
    const discStream = readStreamFromStorage(path.join(dir, fileMeta.path))

    const { readable, writable } = new TransformStream({
        transform(chunk: Uint8Array, controller) {
            console.log(`Stream chunk: ${chunk.byteLength} bytes`)
            controller.enqueue(chunk)
        }
    })

    discStream.pipeTo(writable).catch(err => {
        console.error("Stream error:", err)
    })

    const encodedName = encodeURIComponent(fileMeta.originalName).replace(/[!*'()]/g, '-');
    return new Response(readable, {
        headers: {
            "Content-Type": fileMeta.mimeType,
            "Content-Disposition": `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`
        },
    })
}
