import { Types } from 'mongoose';
import mongoose from 'mongoose';
import User from '../models/User.js';
import OrganizationMember from '../models/OrganizationMember.js';
import { createNotifications, type CreateNotificationParams } from './notificationHelper.js';

export const parseAndNotifyMentions = async (
  text: string,
  taskId: Types.ObjectId,
  taskKey: string,
  taskTitle: string,
  senderId: Types.ObjectId,
  senderName: string,
  existingRecipients: Types.ObjectId[],
  sourceType: 'comment' | 'description'
): Promise<Types.ObjectId[]> => {
  try {
    if (!text) return [];

    // Scan for typical username patterns: @username (allow alphabets, numbers, underscore, dot, hyphen)
    const matches = [...text.matchAll(/@([a-zA-Z0-9_]+(?:[.-][a-zA-Z0-9_]+)*)/g)];
    if (matches.length === 0) return [];

    const usernames = Array.from(new Set(matches.map(match => match[1].toLowerCase())));

    // Fetch the task to get its organization ID
    const Task = mongoose.model('Task');
    const task = await Task.findById(taskId).select('organization');
    if (!task) return [];
    const orgId = task.organization;

    // Fetch all active organization members
    const orgMembers = await OrganizationMember.find({
      organization: orgId,
      status: 'active'
    }).populate({
      path: 'user',
      select: '_id name username role'
    });

    // Extract populated user documents and match in JS
    const matchedUsers = orgMembers
      .map(m => m.user as unknown as { _id: Types.ObjectId, name?: string, username?: string, role?: string })
      .filter((u): u is { _id: Types.ObjectId, name?: string, username?: string, role?: string } => !!u)
      .filter(u => u.role !== 'client')
      .filter(u => {
        const dbUsername = u.username ? u.username.toLowerCase() : '';
        const derivedUsername = u.name ? u.name.toLowerCase().replace(/\s+/g, '') : '';
        return usernames.includes(dbUsername) || usernames.includes(derivedUsername);
      });

    const existingRecipientStrings = new Set(existingRecipients.map(r => r.toString()));

    // Filter recipients (exclude sender and those who already received standard notification)
    const mentionRecipients = matchedUsers
      .filter(u => u._id.toString() !== senderId.toString() && !existingRecipientStrings.has(u._id.toString()))
      .map(u => u._id);

    if (mentionRecipients.length > 0) {
      const notifications: CreateNotificationParams[] = mentionRecipients.map(recipientId => ({
        recipient: recipientId,
        sender: senderId,
        type: sourceType === 'comment' ? 'COMMENT_ADDED' : 'PROJECT_UPDATED',
        title: `Mentioned in ${taskKey}`,
        message: `${senderName} mentioned you in a ${sourceType} on "${taskTitle}": "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`,
        relatedEntity: taskId,
        entityModel: 'Task',
      }));

      await createNotifications(notifications);
    }

    return mentionRecipients;
  } catch (error) {
    console.error('Error in parseAndNotifyMentions utility:', error);
    return [];
  }
};
