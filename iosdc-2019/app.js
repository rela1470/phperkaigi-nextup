const forteeUri = "https://fortee.jp/iosdc-japan-2019/";

const trackId = {
    'Track A' : 0,
    'Track B' : 1,
    'Track C' : 2,
    'Track D' : 3,
    'Track E' : 4,
};
const hashTag = {
    'Track A' : '#iosdc #a',
    'Track B' : '#iosdc #b',
    'Track C' : '#iosdc #b',
    'Track D' : '#iosdc #b',
    'Track E' : '#iosdc #b',
};

function createUrl (path) {
    return forteeUri + path
}

const router = new VueRouter({
    mode: 'history',
    routes: [],
})

const app = new Vue({
    router,
    el: '#app',
    data: {
        results: [],
        isSingle: true,
        loading: true,
        isMovie: false
    },
    mounted() {
        this.getProposals()
    },
    methods: {
        getProposals() {
            //let url = 'api/accepted.json';
            let url = createUrl('api/proposals/accepted')
            axios.get(url).then(response => {
                this.results = response.data.proposals
                this.loading = false
            })
                .catch(error => {
                    console.log(error)
                });

        }
    },
    computed: {
        processedProposals() {
            this.isMovie = (this.$route.query.is_movie == 1)
            let proposals = []

            //時間順にソート
            this.results = _.orderBy(this.results, ['timetable.starts_at'], ['asc'])

            this.results.forEach(proposal => {

                //現在時刻
                let now = moment().add(this.$route.query.add_min, 'minutes').toISOString()
                //let now = moment('2019-03-31T14:39:00+09:00').toISOString()

                //終了時間
                proposal.timetable.end_at = moment(proposal.timetable.starts_at).add(proposal.timetable.length_min, 'minutes')

                let addMin = (proposal.title == 'ランチセッション') ? 40 : 10

                //is_movieがtrueだったら現在のセッションを表示
                //falseだったら次のセッションを表示
                if (
                    (this.isMovie && moment(proposal.timetable.end_at).add(addMin, 'minutes').isAfter(now) ) ||
                    (! this.isMovie && moment(proposal.timetable.starts_at).isAfter(now))
                ) {

                    //url
                    proposal.url = createUrl('proposal/' + proposal.uuid)
                    proposal.hashTag = hashTag[proposal.timetable.track]

                    //ルームチェック
                    if (this.$route.query.room) {
                        if (proposals.length == 0 && proposal.timetable.track == this.$route.query.room)
                        {
                            this.isSingle = true;
                            proposals.push(proposal)
                        }
                    }
                    else {
                        if (proposals.length < 4) proposals.push(proposal)
                    }
                }
            })
            this.isSingle = proposals.length < 4
            return proposals
        }
    },
    filters: {
        moment_time: function (date) {
            return moment(date).format('HH:mm')
        },
        moment_day: function (date) {
            return moment(date).format('M/D (ddd)')
        }
    }
})
