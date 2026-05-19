
//jsonのテストデータを取る
export async function jsonget() {
    try {
        const res = await fetch('https://jsonplaceholder.typicode.com/users', {
            method: 'GET',
            headers: { Accept: 'application/json' }, // 期待する返り値を伝える
        });
        return await res.json()
    } catch (error) {
        console.log("jsonget server error: "+ error)
    }
}