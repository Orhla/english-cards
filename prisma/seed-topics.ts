import 'dotenv/config';
import { prisma } from "@/lib/prisma";

const topics = await prisma.topic.createMany({
    data: [
        { name: 'abstract' },
        { name: 'appearance' },
        { name: 'city_life' },
        { name: 'clothes' },
        { name: 'communication' },
        { name: 'culture' },
        { name: 'education' },
        { name: 'emotions' },
        { name: 'entertainment' },
        { name: 'family' },
        { name: 'food' },
        { name: 'health' },
        { name: 'home' },
        { name: 'law' },
        { name: 'media' },
        { name: 'money' },
        { name: 'nature' },
        { name: 'personality' },
        { name: 'politics' },
        { name: 'science' },
        { name: 'shopping' },
        { name: 'society' },
        { name: 'sport' },
        { name: 'time' },
        { name: 'technology' },
        { name: 'travel' },
        { name: 'weather' },
        { name: 'work' },
        { name: 'other' }
    ]
})