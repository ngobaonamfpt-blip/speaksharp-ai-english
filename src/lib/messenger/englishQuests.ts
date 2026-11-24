export interface EnglishReplyChoice {
  text: string;
  viHint: string;
  quality: 'best' | 'good' | 'retry';
  npcFeedback: string;
  xp: number;
}

export interface EnglishNpcQuest {
  stopId: string;
  npcModel: string;
  checklistTitle: string;
  npcRole: string;
  promptEn: string;
  promptVi: string;
  keyPhrase: string;
  choices: EnglishReplyChoice[];
}

export const ENGLISH_NPC_QUESTS: Record<string, EnglishNpcQuest> = {
  'town-post': {
    stopId: 'town-post',
    npcModel: 'office-worker',
    checklistTitle: '1. Morning Parcel Dispatch',
    npcRole: 'Postmaster Ben · Office Clerk',
    promptEn: 'Good morning! We have four express parcels today. Are you ready to hit the road?',
    promptVi: 'Chào buổi sáng! Hôm nay có 4 bưu kiện hỏa tốc. Bạn đã sẵn sàng lên đường chưa?',
    keyPhrase: 'hit the road = bắt đầu lên đường',
    choices: [
      {
        text: "You bet! Hand them over and I'll deliver them right on schedule.",
        viHint: 'Chắc chắn rồi! Đưa đây, mình sẽ giao đúng hẹn.',
        quality: 'best',
        npcFeedback: 'Love that energy! Follow the golden arrow around the planet!',
        xp: 35,
      },
      {
        text: 'Yes, I am ready to deliver the parcels now.',
        viHint: 'Vâng, tôi đã sẵn sàng đi giao bưu kiện ngay.',
        quality: 'good',
        npcFeedback: 'Awesome! Safe travels through the town alleys!',
        xp: 25,
      },
      {
        text: 'Sorry, I forgot how to ride a bicycle yesterday.',
        viHint: '(Lạc đề) Xin lỗi, hôm qua tôi quên cách đi xe đạp.',
        quality: 'retry',
        npcFeedback: 'Haha, no bicycle needed—just your sneakers! Try confirming you are ready to deliver.',
        xp: 0,
      },
    ],
  },
  'cliff-lookout': {
    stopId: 'cliff-lookout',
    npcModel: 'scout',
    checklistTitle: '2. Trail Supplies at Cliffside',
    npcRole: 'Scout Hana · Cliffside Lookout',
    promptEn: 'Whoa, you climbed all the way up here! Did you bring my camping compass?',
    promptVi: 'Ồ, bạn leo tận lên đây luôn! Bạn có mang la bàn cắm trại cho mình không?',
    keyPhrase: 'all the way up = tận lên trên này',
    choices: [
      {
        text: 'Right here! It was a steep climb, but the view is totally worth it.',
        viHint: 'Ngay đây nè! Dốc hơi cao nhưng cảnh đẹp rất xứng đáng.',
        quality: 'best',
        npcFeedback: 'Spot on! You sound like a true explorer. Thanks a million!',
        xp: 35,
      },
      {
        text: 'Yes, here is your compass from the Post Office.',
        viHint: 'Vâng, la bàn của bạn từ Bưu điện đây.',
        quality: 'good',
        npcFeedback: 'Thank you so much, courier! That was super fast!',
        xp: 25,
      },
      {
        text: 'I would like two cups of iced coffee, please.',
        viHint: '(Lạc đề) Cho tôi hai ly cà phê đá nhé.',
        quality: 'retry',
        npcFeedback: 'Haha, no café up on this cliff! Hand over the compass instead.',
        xp: 0,
      },
    ],
  },
  'waterfall-cove': {
    stopId: 'waterfall-cove',
    npcModel: 'musician',
    checklistTitle: '3. Guitar Strings by the Falls',
    npcRole: 'Musician Sora · Waterfall Overlook',
    promptEn: 'Hey there! My acoustic guitar snapped a string mid-song. Tell me you have the spare pack!',
    promptVi: 'Chào bạn! Đàn guitar của mình vừa đứt dây giữa bài. Nói là bạn có gói dây dự phòng đi!',
    keyPhrase: 'snapped a string = bị đứt dây đàn',
    choices: [
      {
        text: 'Saved by the bell! Fresh guitar strings, express delivery for you.',
        viHint: 'Cứu nguy đúng lúc! Dây đàn mới tinh giao hỏa tốc cho bạn đây.',
        quality: 'best',
        npcFeedback: 'Legend! Now I can finish this coastal melody for the whole town!',
        xp: 35,
      },
      {
        text: 'Yes, I brought your spare guitar strings right here.',
        viHint: 'Có chứ, mình mang dây đàn dự phòng cho bạn đây.',
        quality: 'good',
        npcFeedback: 'What a relief! Thank you, little messenger!',
        xp: 25,
      },
      {
        text: 'The weather forecast says it might snow in August.',
        viHint: '(Lạc đề) Dự báo thời tiết nói tháng 8 có thể có tuyết.',
        quality: 'retry',
        npcFeedback: 'Haha, nice small talk—but my guitar still needs those strings!',
        xp: 0,
      },
    ],
  },
  'harbor-town': {
    stopId: 'harbor-town',
    npcModel: 'chef',
    checklistTitle: '4. Fresh Spices for Harbor Café',
    npcRole: 'Chef Mochi · Harbor Street Café',
    promptEn: 'Just in time! The pastries are in the oven—did the vanilla beans make it in one piece?',
    promptVi: 'Đúng lúc lắm! Bánh đang trong lò — hộp vani có đến nơi nguyên vẹn không?',
    keyPhrase: 'in one piece = còn nguyên vẹn',
    choices: [
      {
        text: 'Safe and sound! Not a single scratch on the box, Chef.',
        viHint: 'An toàn nguyên vẹn! Không một vết xước nào trên hộp luôn bếp trưởng ơi.',
        quality: 'best',
        npcFeedback: 'Magnifique! Grab a warm croissant on the house!',
        xp: 35,
      },
      {
        text: 'Yes, the package arrived safely and undamaged.',
        viHint: 'Vâng, gói hàng đến nơi an toàn và không bị hư hại.',
        quality: 'good',
        npcFeedback: 'Wonderful service! Thank you so much!',
        xp: 25,
      },
      {
        text: 'My favorite color is definitely turquoise blue.',
        viHint: '(Lạc đề) Màu yêu thích của tôi chắc chắn là xanh ngọc.',
        quality: 'retry',
        npcFeedback: 'Lovely color, courier—now let me check on those vanilla beans!',
        xp: 0,
      },
    ],
  },
  'south-observatory': {
    stopId: 'south-observatory',
    npcModel: 'diver',
    checklistTitle: '5. A Note Lost at Sea',
    npcRole: 'Diver Kai · Southern Cove',
    promptEn: 'Ahoy, courier! I just surfaced from the reef. Is that the waterproof logbook I ordered?',
    promptVi: 'Chào người đưa thư! Mình vừa lặn rạn san hô lên. Có phải cuốn sổ chống nước mình đặt không?',
    keyPhrase: 'surfaced from = vừa ngoi lên từ',
    choices: [
      {
        text: 'Mission accomplished! One waterproof logbook, signed and sealed.',
        viHint: 'Nhiệm vụ hoàn thành! Một cuốn sổ chống nước niêm phong đầy đủ đây.',
        quality: 'best',
        npcFeedback: 'Brilliant! You crossed the whole planet in record time!',
        xp: 35,
      },
      {
        text: 'Yes, here is your waterproof logbook.',
        viHint: 'Vâng, cuốn sổ chống nước của bạn đây.',
        quality: 'good',
        npcFeedback: 'Thanks a ton! See you on the next dive!',
        xp: 25,
      },
      {
        text: 'Where can I buy a ticket to the train station?',
        viHint: '(Lạc đề) Tôi có thể mua vé ra ga tàu ở đâu?',
        quality: 'retry',
        npcFeedback: 'No trains on this tiny island—hand over that logbook!',
        xp: 0,
      },
    ],
  },
};

/** Speak an English sentence aloud using the browser's Web Speech API */
export function speakEnglish(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.94;
    utter.pitch = 1.04;
    const voices = window.speechSynthesis.getVoices();
    const enVoice =
      voices.find((v) => v.lang.startsWith('en-US') && /Natural|Google|Samantha|Zira/i.test(v.name)) ??
      voices.find((v) => v.lang.startsWith('en'));
    if (enVoice) utter.voice = enVoice;
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore speech errors
  }
}
