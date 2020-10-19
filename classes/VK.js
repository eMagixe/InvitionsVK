const easyvk = require('easyvk');
const path = require('path');
module.exports = class VK {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
    sendInvite = async (group_id, user_id, index) => {
        await easyvk({
            username: this.username,
            password: this.password,
            sessionFile: path.join(__dirname, '.my-session')
        }).then(async vk => {
            await vk.call('groups.invite', {
                group_id: group_id,
                user_id: user_id,
            }).then(() => {
                console.log(`Invite #${index} id: ${user_id} is sending.`);
                return true;
            }).catch(error => {
                return this.errors(error, index, user_id);
            });
        })
        .catch(error => {
            console.error(error);
        })
    }

    errors = (error, index, user_id) => {
        let { error_msg, error_code } = error || {};
        switch (error_code) {
            case undefined: console.error(error);
            break;
            case 15: console.error(`#${index} invite not send. User: ${user_id} ${error_msg}.`);
            break;
            case 14: return new Error(error_msg);
        }
        return false;
    }

    getFriends = (user_id) => {
        return easyvk({
            username: this.username,
            password: this.password,
            sessionFile: path.join(__dirname, '.my-session')
        }).then(async vk => {
            let friend_ids = await vk.call('friends.get', {
                user_id: user_id,
            });
            return friend_ids.items;
        }).catch(error => {
            console.error(error);
            return [];
        })
    }
}