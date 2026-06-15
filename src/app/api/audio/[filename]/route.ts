import { auth } from "@/auth"
import { readFile } from "fs/promises"
import { join, basename } from "path"

export async function GET(
    _req: Request,
    ctx: RouteContext<"/api/audio/[filename]">
) {
    const session = await auth()
    console.log("audio session", session)
    if (!session) {
        return new Response("Unauthorized", { status: 401 })
    }
    if (session.user.role !== "admin") {
        return new Response("unauthorized", { status: 401 })
    }

    const { filename } = await ctx.params
    // Prevent path traversal: only allow the bare filename, no slashes
    if (filename !== basename(filename)) {
        return new Response("Bad Request", { status: 400 })
    }

    const filePath = join(process.cwd(), "data", filename)
    let data: Buffer
    try {
        data = await readFile(filePath)
    } catch {
        return new Response("Not Found", { status: 404 })
    }

    const ext = filename.split(".").pop()?.toLowerCase()
    const contentType = ext === "ogg" ? "audio/ogg" : "application/octet-stream"

    return new Response(data, {
        headers: { "Content-Type": contentType },
    })
}
