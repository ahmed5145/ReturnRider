/** Seasonal in-app campaign copy (MKT-02). */
export interface Campaign {
  id: string;
  title: string;
  body: string;
}

export function getActiveCampaign(now = new Date()): Campaign | null {
  const month = now.getMonth(); // 0 = Jan

  // Nov–Jan: holiday return crunch
  if (month === 10 || month === 11 || month === 0) {
    return {
      id: 'holiday_returns',
      title: 'Holiday returns expire fast',
      body: 'Post-holiday return windows often end by Jan 31. Ship soon or snooze if you need a few more days.',
    };
  }

  // Jun–Aug: summer shopping returns
  if (month >= 5 && month <= 7) {
    return {
      id: 'summer_returns',
      title: 'Summer return season',
      body: 'Wedding gifts, patio furniture, and vacation buys — check deadlines before fall gets busy.',
    };
  }

  return null;
}
