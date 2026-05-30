import 'dotenv/config';
import { prisma } from "@/lib/prisma";
import { partOfSpeech } from "@/generated/prisma/enums";

// классные словечки. Я их не знаю )))
const wordCards = await prisma.wordCard.createMany({
  data: [
    { word: "ubiquitous",
      partsOfSpeech: [partOfSpeech.adjective],
      transcription: "/juːˈbɪk.wɪ.təs/",
      translation: ["повсеместный",
                    "вездесущий",
                    "распространённый"
      ],
      meaning: ["existing or being everywhere at the same time",
                "constantly encountered",
                "widespread"
            ],
      examples: ["Smartphones are used ubiquitously by young people.",
                 "The company's ads are ubiquitous."
                ]
    },

    { word: "alleviate",
      partsOfSpeech: [partOfSpeech.verb],
      transcription: "/əˈliː.vi.eɪt/",
      translation: ["облегчать",
                    "смягчать",
                    "снизить"
      ],
      meaning: ["to make (something, such as pain or suffering) more bearable",
                "to partially remove or correct (something undesirable)"
            ],
      examples: ["a drug that alleviates the symptoms",
                 "using relaxation techniques to alleviate stress",
                 "government programs to alleviate poverty",
                 "Investing in public transport can help alleviate traffic congestion in urban areas."
                ]
    },

    { word: "meticulous",
      partsOfSpeech: [partOfSpeech.adjective],
      transcription: "/məˈtɪk.jə.ləs/",
      translation: ["тщательный",
                    "дотошный",
                    "скрупулёзный",
                    "педантичный",
                    "кропотливый"
      ],
      meaning: ["very careful about doing something in an extremely accurate and exact way",
                "showing or requiring extreme care and attention to detail"
            ],
      examples: ["Scientists must be meticulous when conducting experiments or recording data to ensure accurate results.",
                 "keeps meticulous records",
                 "a meticulous researcher",
                 "She was meticulous about keeping her expense receipts properly filed."
                ]
    },
  ]
});
