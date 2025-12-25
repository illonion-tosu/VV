export async function sendLog(logObject, collection, api) {
    try {
        const body = JSON.stringify(logObject, (key, value) =>
            value === undefined ? null : value
        )
        const res = await fetch(`http://46.62.195.72:3000/${collection}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": api,
            },
            body: body,
        })
      const data = await res.json()
    } catch (err) {
      console.error("Log failed:", err)
    }
}