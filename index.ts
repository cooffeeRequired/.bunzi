import server from './src/Bunzii.ts';
import { BunziResponse } from './src/BunziResponse.ts';
import { BunzRequest } from './src/types';

server
    .setEngine('handlebars')
    .get('/', (req: BunzRequest, res: BunziResponse) => res.status(200).send('Ahoj'))
    .get('/json', (req: BunzRequest, res: BunziResponse) => res.status(200).json({ name: 'Bunzi', version: '1.0.0' }))
    .get('/r', (req: BunzRequest, res: BunziResponse) => res.status(200).render('@home', { name: 'Bunzi', version: '1.0.0' }))
    .listen(3002);