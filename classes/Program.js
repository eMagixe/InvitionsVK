const VK = require('./VK');
let CronJob = require('cron').CronJob;
let fs = require('fs');

module.exports = class Program {
    constructor(env, path) {
        let { LOGIN, PASSWORD, ID, INVITE_COUNT, GROUP_ID } = env;
        this.GROUP_ID = GROUP_ID;
        this.invite_count = Number(INVITE_COUNT) || 20;
        this.ID = ID;
        this.account = new VK(LOGIN, PASSWORD);
        this.path = path;
        this.index = 0;
    }
    getLastUser = async () => {
        let user = await fs.readFileSync(this.path);
        return JSON.parse(user).id;
    }
    setLastUser = async (user_id) => {
        let last_user = {
            id: user_id
        };
        return fs.writeFileSync(
            this.path,
            JSON.stringify(last_user)
        )
    }
    start = async () => {
        let last_user = await this.getLastUser();
        console.log('Get friends for', this.ID);
        let friend_ids = await this.account.getFriends(this.ID);
        let last_index = friend_ids.indexOf(last_user);
        let not_found = last_index === -1;
        if (not_found) {
            console.error(`${last_user} not found in list.`);
        } else {
            console.log('Start send invite with', last_user);
            await this.sending(last_index, friend_ids);
        }
    }
    sending = async (last_index, friend_ids) => {
        let current_ids = friend_ids.slice(last_index, last_index + this.invite_count + 1);
        await this.setLastUser(current_ids.pop());
        let generator = this.genFriendId(current_ids);
        this.pushing(this.account.sendInvite, generator);
    }
    onTick = (func, generator) => {
        if (this.index >= this.invite_count) {
            return new Error(`Cron stop. Limit is full: ${this.index}`);
        }
        let user_id = generator.next().value;
        if (user_id) {
            if(!func(this.GROUP_ID, user_id, this.index)) this.index--;
        } else {
            return new Error('Cron stop. User list is empty.');
        }
    }
    pushing = (func, generator) => {
        let job = new CronJob(
            '0 */1 * * * *',
            () => {
                this.onTick(func, generator);
            },
            null,
            true,
            'Europe/Moscow'
        );
        job.start();
        console.log('Cron start...');
    }
    * genFriendId (list) {
        while (this.index < list.length) yield list[this.index++];
    }
}