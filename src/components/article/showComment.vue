<template>
    <n-modal :show="show" @mask-click="close">
        <!-- <Popup round :show="show" @click-overlay="close" position="center"> -->
        <div class="model">
            <h2 v-if="isVote && showVote">打分</h2>
            <h2 v-else>回复</h2>

            <ul class="selectTopTip items-center" :class="{ disabled: loading }">

                <n-popover trigger="click" placement="top">
                    <template #trigger>
                        <li @click="checkEmojiPopover">
                            <span class="EmojiIcon">😀</span>
                        </li>
                    </template>
                    <div style="max-width:300px;height: 244px;width: 300px;">
                        <n-tabs animated>
                            <n-tab-pane :tab="v[0].emoji" v-for="(v, k) in emojis" :name="k" :title="v[0].emoji">
                                <ul class="emojiGrid">
                                    <li @click="setEmoji(item)" v-for="item in v" class="select-none flex justify-center items-center">
                                        {{ item.emoji }}
                                    </li>
                                </ul>
                            </n-tab-pane>

                        </n-tabs>

                    </div>
                </n-popover>
                <!-- <li>
                    <Uploader v-model="imageList" max-count="3" :preview-image="false">
                        <Icon class="iconFontSvg" name="ci:image" />
                    </Uploader>
                </li> -->
            </ul>
            <div id="Editor">
                <textarea :disabled="loading" v-model="content" ref="editorInput" type="text" placeholder="输入评论"></textarea>
            </div>
            <div class="voteBox" v-if="isVote && showVote">
                <n-form-item class="voteInput" :rule="{ required: true, message: '请输入谱面评分' }">
                    <template #label>
                        <n-checkbox v-model:checked="checkedChartVote">谱面分数</n-checkbox>
                    </template>
                    <n-input-number :disabled="!checkedChartVote" clearable :precision="1" :max="100" :min="0"
                        v-model:value="chartScore" button-placement="both" />
                </n-form-item>
                <n-form-item class="voteInput" label="音乐分数" :rule="{ required: true, message: '请输入音乐评分' }">
                    <template #label>
                        <n-checkbox v-model:checked="checkedMusicVote">音乐分数</n-checkbox>
                    </template>
                    <n-input-number :disabled="!checkedMusicVote" clearable :precision="1" :max="100" :min="0"
                        v-model:value="musicScore" button-placement="both" />
                </n-form-item>
            </div>
            <!-- <ol class="previewImages">
                <li v-for="(item, i) in imageList">
                    <img class="previewImage" :src="item.content" alt="">
                    <span class="center close" @click="imageList.splice(i, 1)">
                        <Icon name="material-symbols:close-rounded"></Icon>
                    </span>
                </li>
            </ol> -->
            <n-button style="margin-top:12px" :disabled="loading" :loading="loading" @click="sendComment" type="primary"
                round block>回复</n-button>
        </div>
        <!-- </Popup> -->
    </n-modal>
</template>

<script lang="ts" setup>
import { NFormItem, NInputNumber, NCheckbox, useMessage } from "naive-ui"
// import { Uploader, Popup, Popover, Tab, Tabs, Button, showFailToast, showSuccessToast, UploaderFileListItem } from "vant";
import * as unicodeEmoji from 'unicode-emoji';
import { commentPost } from "@/api/comment";
import type { User } from "@/api/user";
import type { Article, Comment, MonfVoteDetail } from "@/api/post"
import { ref, nextTick } from "vue";
const checkedChartVote = ref(false)
const checkedMusicVote = ref(false)
const editorInput = ref<HTMLTextAreaElement>()
const content = ref("");
const chartScore = ref(0);
const musicScore = ref(0);

const message = useMessage()
// const imageList = ref<UploaderFileListItem[]>([])
const loading = ref(false)
const emojis = unicodeEmoji.getEmojisGroupedBy("category", {
    version: ["12.1"]
})


function checkEmojiPopover() {
    // emojiShow.value = !emojiShow.value;
    // console.log(emojiShow.value)
}
let startRenge = 0
function setEmoji(e: unicodeEmoji.BaseEmoji) {
    if (editorInput.value) {
        const input = editorInput.value;
        startRenge = input.selectionStart; // 保存常量
        let start = input.selectionStart; // 保存光标位置
        const v = Array.from(content.value); // 数组拆分
        v.forEach((e, i) => {
            if (e.length > 1 && start > i) start -= 1;
        });
        content.value = [...v.slice(0, start), e.emoji, ...v.slice(start)].join("");
        nextTick(() => {
            input.focus();
            input.setSelectionRange(startRenge, startRenge)
        })
    }
}

interface Prop {
    show: boolean;
    commentId: number | string | null;
    postId: number | string | null;
    isVote?: boolean;
    showVote: boolean;
}
interface Emit {
    (event: 'update:show', bool: boolean): void;
    (event: 'success', user: User[], comment: Comment, monfDetalis?: MonfVoteDetail[]): void

}
const prop = defineProps<Prop>();
const emit = defineEmits<Emit>();

function close() {
    if (!loading.value) {
        emit("update:show", false)
    }
}
async function sendComment() {
    const str = content.value.trim()
    if (str.length <= 0) {
        message.warning("请填写评论")
        return;
    }
    loading.value = true;
    try {
        if (!prop.postId) throw new Error("不存在此帖子")
        let commentId: null | undefined | string | number = prop.commentId;
        if (commentId === null) commentId = undefined;
        let monfVote = undefined;
        if (checkedChartVote.value && prop.isVote) {
            monfVote = {
                chartScore: chartScore.value,
            }
        }
        if (checkedMusicVote.value && prop.isVote) {
            if (monfVote) {
                Reflect.set(monfVote, "musicScore", musicScore.value)
            } else {
                monfVote = {
                    musicScore: musicScore.value,
                }
            }
        }

        const { data: { includes: { users, monfVoteDetails }, comment } } = await commentPost(prop.postId, str, commentId, monfVote);
        message.success("评论成功")
        checkedChartVote.value = false
        checkedMusicVote.value = false
        content.value = ""
        chartScore.value = 0
        musicScore.value = 0
        emit("success", users, comment, monfVoteDetails)
        loading.value = false;
        close()

    } finally {
        loading.value = false
    }
}

</script>
<style lang="scss" scoped>
.voteInput {
    width: 45%;

    :deep(.n-checkbox__label) {
        padding-right: 0px;
    }
}

.voteBox {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
}

.model {
    max-width: 90vw;
    width: 450px;
    border-radius: 8px;
    background-color: var(--mug-card-bg);
    padding: 36px;
    color: var(--mug-text);

    h2 {
        text-align: center;
        margin-bottom: 24px;
    }
}

.EditorEle {
    max-width: 90vw;
    width: 100%;
    max-height: 30vh;
    height: 430px;
}

.emojiGrid {
    width: 300px;
    padding: 6px;
    height: 200px;
    justify-content: space-between;
    display: grid;
    overflow-y: auto;
    grid-template-columns: repeat(8, 30px);

    li {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        transition: all 0.32s;

        // cursor: pointer;
        &:hover {
            background-color: var(--mug-card-sub-bg);
        }
    }

    &::-webkit-scrollbar {
        display: none;
    }
}

.disabled {
    pointer-events: none !important;
    user-select: none !important;

    * {
        user-select: none !important;
        pointer-events: none !important;
    }
}

#Editor {
    background-color: var(--mug-card-sub-bg);
    border-radius: 12px;
    height: 150px;
    overflow: hidden;
    margin-bottom: 12px;
    padding: 8px 0;
    padding-right: 6px;

    textarea {
        border-radius: 12px;
        padding: 6px 12px;
        width: 100%;
        height: 100%;
        border: none;
        background-color: transparent;
        resize: none;
        outline: none;
        &::-webkit-scrollbar {
            width: 6px;
        }

        /* 滚动槽 */
        &::-webkit-scrollbar-track {
            border-radius: 10px;
        }

        /* 滚动条滑块 */
        &::-webkit-scrollbar-thumb {
            border-radius: inherit;
            background-color: rgba(144, 147, 153, 0.3);
            -webkit-transition: 0.3s background-color;
            transition: 0.3s background-color;
        }
    }
}

.selectTopTip {
    background-color: var(--mug-card-sub-bg);
    border-radius: 16px;
    margin-bottom: 12px;
    padding: 0 8px;

    .EmojiIcon {
        height: 100%;
        display: flex;
        align-items: center;
        padding-bottom: 3px;
    }

    li {
        user-select: none;
        cursor: pointer;
        font-size: 20px;
        border-radius: 16px;
        height: 34px;
        width: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

.iconFontSvg {
    transform: translateY(14%);
    cursor: pointer;
}

.previewImage {
    object-fit: cover;
    width: 80px;
    height: 80px;
    border-radius: 4px;
}

.previewImages {
    display: flex;
    margin: 12px 0 0;

    li {
        margin-right: 12px;
        position: relative;
    }

    .close {
        position: absolute;
        right: 0;
        top: 0;
        transform: translateX(50%) translateY(-50%);
        width: 20px;
        height: 20px;
        background-color: var(--mug-card-sub-bg);
        border-radius: 50%;
        cursor: pointer;
        padding: 2px;
    }
}
</style>    
