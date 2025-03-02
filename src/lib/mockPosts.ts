import {
  randomNumberBetween,
  getRandomDateAfter,
  getRandomDateBefore,
  getRandomUID,
} from "@/lib/utils";
import { randomData } from "@/lib/randomData";

import { Timestamp } from "firebase/firestore";

export async function generateMockData() {
  const postsToAdd = 5;
  const data = [];

  const answersData = [];

  for (let i = 0; i < postsToAdd; i++) {
    const postCreated = Timestamp.fromDate(getRandomDateBefore());
    const postModified = Timestamp.fromDate(
      getRandomDateAfter(postCreated.toDate())
    );
    const posterId = getRandomUID();

    const answers = [];

    for (let j = 0; j < randomNumberBetween(3, 5); j++) {
      const votes = randomNumberBetween(0, 100);
      const userVotes = [];
      for (let k = 0; k < votes; k++) {
        userVotes.push(getRandomUID());
      }
      const answerData = {
        answer:
          randomData.answers[
            randomNumberBetween(0, randomData.answers.length - 1)
          ],
        votes: votes,
        userVotes: userVotes,
      };

      answersData.push(answerData);
    }

    const tags: Array<string> = [];

    for (let j = 0; j < randomNumberBetween(1, 5); j++) {
      tags.push(
        randomData.tags[randomNumberBetween(0, randomData.tags.length - 1)]
      );
    }

    const postData = {
      title:
        randomData.postTitles[
          randomNumberBetween(0, randomData.postTitles.length - 1)
        ],
      description:
        randomData.postDescriptions[
          randomNumberBetween(0, randomData.postDescriptions.length - 1)
        ],
      posterId: posterId,
      posterDisplayName:
        randomData.names[randomNumberBetween(0, randomData.names.length - 1)],
      createdAt: postCreated,
      modifiedAt: postModified,
      tags: tags,
    };

    data.push({
      postData,
      answersData,
    });
  }
  return data;
}
