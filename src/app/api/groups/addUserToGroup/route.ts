import { NextApiRequest, NextApiResponse } from 'next';
import { getSqlClient } from '@/lib/database';
import { Group } from '@/schemas/group';
import { UserId } from '@/types';

export default async function addUserToGroup(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { groupId, userIds } = req.body; // Expecting an array of userIds

  if (!groupId || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid input.' });
  }

  try {
    const sql = getSqlClient();

    // Fetch the existing group
    const existingGroup: Group[] = await sql`
      SELECT * FROM groups WHERE groupId = ${groupId}
    `;
    if (existingGroup.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // Get current members of the group
    const currentMembers: UserId[] = existingGroup[0].members;

    // Filter out users who are already in the group
    const newUsers = userIds.filter(userId => !currentMembers.includes(userId));

    if (newUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All users are already part of this group.',
      });
    }

    // Update the group's members with new users
    await sql`
      UPDATE groups
      SET members = array_append(members, ${newUsers})
      WHERE groupId = ${groupId}
    `;

    return res.status(200).json({
      success: true,
      message: 'Users successfully added to the group.',
    });
  } catch (error) {
    console.error('Error adding users to group:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add users to the group.',
    });
  }
}
