import { AuthType, EmbedEvent, init, LiveboardEmbed } from '../dist/tsembed.es.js';

init({
    thoughtSpotHost: 'https://embed-1-do-not-delete.thoughtspotstaging.cloud',
    authType: AuthType.None,
});

const vizs = [{
    liveboardId: 'd084c256-e284-4fc4-b80c-111cb606449a',
    vizId: 'e7d38eb2-6e17-45ee-9804-2356fa17d442'
}, {
    liveboardId: 'd084c256-e284-4fc4-b80c-111cb606449a',
    vizId: 'f566ab55-31e1-4be9-a364-e17b2ec58593'
}, {
    liveboardId: 'd084c256-e284-4fc4-b80c-111cb606449a',
    vizId: '27918f62-1cac-4b6c-abec-2f81a9effbc5'
}, {
    liveboardId: 'd084c256-e284-4fc4-b80c-111cb606449a',
    vizId: '15301d81-d261-4d7c-bb43-650ce4980230'
}, {
    liveboardId: '6ed29fd9-aad3-41aa-9e42-a3b11bfcd088',
    vizId: '7f0ef46e-8e90-4db9-a844-ad70742d1235',
}, {
    liveboardId: '6ed29fd9-aad3-41aa-9e42-a3b11bfcd088',
    vizId: '632dc473-82c8-4630-97e8-40f7bc9b5dd6'
}, {
    liveboardId: '6ed29fd9-aad3-41aa-9e42-a3b11bfcd088',
    vizId: '41924815-053c-4daa-8786-03d0df2ff46e'
}, {
    liveboardId: '5841a546-cb11-4503-b34d-4c7bd26fc760',
    vizId: 'a3f0110a-bb5e-4f7b-8fa8-04eae652d4f2'
}];

const app = document.getElementById('app');

vizs.slice(5, 6).forEach(viz => {
    const div = document.createElement('div');
    div.classList.add('tile');
    app?.appendChild(div);
    const liveboardEmbed = new LiveboardEmbed(div, {
        liveboardId: viz.liveboardId,
        vizId: viz.vizId,
        showPreviewLoader: true,
        enableV2Shell_experimental: true,
    });
    liveboardEmbed.on(EmbedEvent.Data, () => {
        console.log('Liveboard rendered');
    });
    liveboardEmbed.render();
});
