import type { Article, MonfVoteDetail,Comment } from "./post";
import type { User } from "./user";
import { request } from "@/utils/request"

interface CommentPost {
    includes: {
        users: User[];
        monfVoteDetails: MonfVoteDetail[]
    }
    comment: Comment;
}
/**
 * @POST 评论
 * @param postId 帖子id
 * */
export function commentPost( postId: Article["id"], content: string, parentCommentId?: string | number, monfVote?: any) {
    let data = {
        postId,
        content,
        parentCommentId,
    };
    if (monfVote) {
        Reflect.set(data, "monfVote", {
            ...monfVote
        })
    }
    return request<CommentPost>("comment/publish", {
        method: "POST",
       
        data
    }, {
        130: "您已经投过票了"
    });
}
/**
 * @POST 点赞评论
 * @param postId 帖子id
 * */
export function commentLike( commentId: Article["id"], cancel?: boolean) {
    return request<CommentPost>(`like/comment/${commentId}`, {
        method: "GET",
       
        params: { cancel }
    });
}
