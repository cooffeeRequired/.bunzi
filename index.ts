import server from "./src"

server
    .get('/', (_, res) => res.status(200).send('Hi'))
    .get('/api/hi', (_, res) => res.status(200).send('Welcome'))
    .get('/id/:id', (req, res) => res.status(200).send(`${req.params.id} ${req.query.name}`))
    .post('/api/json', async (req, res) => res.status(200).json(await req.json()))
    .listen(3000)