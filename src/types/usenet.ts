export type PostType = {
    from: string,
    email: string,
    group: string,
    reference: string | undefined,
    subject: string,
    raw: string,
    html: string,
    attachments: any[],
};
