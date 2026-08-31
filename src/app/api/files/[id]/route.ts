// import { auth } from "@/auth"
// import { readFile } from "fs/promises"
// import { join, basename } from "path"
import {requireLogin} from "@/lib/dal";
import {prisma} from "@/lib/prisma";
import {readFromStorage} from "@/services/file-storage";
import {IMAGE_DIR} from "@/lib/consts";

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


    const fileBytes = await readFromStorage(IMAGE_DIR + "/" + fileMeta.path)

    console.log("bytes", !!fileBytes)
    // Prevent path traversal: only allow the bare filename, no slashes
    // if (filename !== basename(filename)) {
    //     return new Response("Bad Request", { status: 400 })
    // }

    // const filePath = join(process.cwd(), "data", filename)
    // let data: Buffer
    // try {
    //     data = await readFile(filePath)
    // } catch {
    //     return new Response("Not Found", { status: 404 })
    // }
    //
    // const ext = filename.split(".").pop()?.toLowerCase()
    // const contentType = ext === "ogg" ? "audio/ogg" : "application/octet-stream"

    return new Response(fileBytes, {
        headers: {
            "Content-Type": fileMeta.mimeType,
            "Content-Disposition": `attachment; filename="${fileMeta.originalName}"`
        },
    })
}
