/**
 * campusCounselorSlots.js
 * Available counselor time slots exported as an array.
 * Both the server (for booking) and client (for display) use this data.
 */

// Generate slots for the next 4 weeks (Mon–Fri only)
const generateSlots = () => {
    const slots = [];
    const times = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
    const now = new Date();

    for (let week = 0; week < 4; week++) {
        for (let day = 1; day <= 5; day++) { // Mon=1 ... Fri=5
            const d = new Date(now);
            const diff = day - d.getDay() + week * 7;
            d.setDate(d.getDate() + diff);
            d.setHours(0, 0, 0, 0);

            if (d < now) continue;

            const dateStr = d.toISOString().split("T")[0];
            for (const time of times) {
                slots.push({ date: dateStr, time, dayOfWeek: d.toLocaleDateString("en-US", { weekday: "short" }) });
            }
        }
    }
    return slots;
};

export const campusCounselorSlots = generateSlots();
export default campusCounselorSlots;
