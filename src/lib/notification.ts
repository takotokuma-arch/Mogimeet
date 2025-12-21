import { format } from "date-fns"
import { ja } from "date-fns/locale"

type EventDetails = {
    id: string
    title: string
    description?: string | null
    confirmed_start_at?: string | null
    confirmed_end_at?: string | null
    admin_token?: string
}

export async function sendDiscordNotification(
    webhookUrl: string,
    type: 'create' | 'finalize' | 'update' | 'remind',
    event: EventDetails,
    context?: {
        participantCount?: number
        daysLeft?: number
    }
) {
    if (!webhookUrl) return

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const eventUrl = `${baseUrl}/events/${event.id}`

    let content = ""
    let embed = {
        title: "",
        description: "",
        color: 0x10B981, // Emerald 500
        fields: [] as any[],
        footer: {
            text: "MogiMeet - 日程調整ツール"
        },
        timestamp: new Date().toISOString()
    }

    switch (type) {
        case 'create':
            embed.title = "🎉 新しいイベントが作成されました"
            embed.description = `**${event.title}**\n\nスケジュール調整をお願いします！`
            embed.fields.push({
                name: "URL",
                value: eventUrl
            })
            if (event.description) {
                embed.fields.push({
                    name: "メモ",
                    value: event.description
                })
            }
            break

        case 'finalize':
            embed.title = "✅ イベントの日程が決定しました！"
            embed.color = 0xEC4899 // Pink 500
            if (event.confirmed_start_at && event.confirmed_end_at) {
                const start = new Date(event.confirmed_start_at)
                const end = new Date(event.confirmed_end_at)
                const dateStr = format(start, "M月d日 (EEE)", { locale: ja })
                const timeStr = `${format(start, "HH:mm")} 〜 ${format(end, "HH:mm")}`

                embed.description = `**${event.title}**\n\n以下の日程で開催されます。各自カレンダーへの登録をお願いします。`
                embed.fields.push({
                    name: "📅 決定日時",
                    value: `**${dateStr}**\n${timeStr}`
                })
            }
            embed.fields.push({
                name: "イベントページ",
                value: eventUrl
            })
            break

        case 'update':
            embed.title = "⚠️ 決定日時が変更されました"
            embed.color = 0xF59E0B // Amber 500
            if (event.confirmed_start_at && event.confirmed_end_at) {
                const start = new Date(event.confirmed_start_at)
                const end = new Date(event.confirmed_end_at)
                const dateStr = format(start, "M月d日 (EEE)", { locale: ja })
                const timeStr = `${format(start, "HH:mm")} 〜 ${format(end, "HH:mm")}`

                embed.description = `**${event.title}**\n\n日程が再設定されました。確認をお願いします。`
                embed.fields.push({
                    name: "📅 新しい日時",
                    value: `**${dateStr}**\n${timeStr}`
                })
            }
            embed.fields.push({
                name: "イベントページ",
                value: eventUrl
            })
            break

        case 'remind':
            embed.title = "⏰ 回答の締め切りが近づいています"
            embed.color = 0x3B82F6 // Blue 500
            embed.description = `**${event.title}**\n\nまだ回答していない方は、お早めにお願いします。`
            embed.fields.push({
                name: "URL",
                value: eventUrl
            })
            break
    }

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: "MogiMeet",
                avatar_url: "https://r2.mogimeet.com/icon.png", // Use meaningful icon or remove
                embeds: [embed]
            })
        })
    } catch (e) {
        console.error("Discord Notification Failed", e)
    }
}
