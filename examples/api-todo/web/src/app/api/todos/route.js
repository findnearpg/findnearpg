import sql from '@/app/api/utils/sql';
import { auth } from '@/auth';

export async function GET() {
	try {
		const session = await auth();
		if (!session?.user) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const todos = await sql`
      SELECT * FROM todos 
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `;
		return Response.json(todos);
	} catch (error) {
		console.error('Error fetching todos:', error);
		return Response.json({ error: 'Failed to fetch todos' }, { status: 500 });
	}
}

export async function POST(request) {
	try {
		const session = await auth();
		if (!session?.user) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { task } = await request.json();
		if (!task) {
			return Response.json({ error: 'Task is required' }, { status: 400 });
		}

		const [todo] = await sql`
      INSERT INTO todos (task, user_id)
      VALUES (${task}, ${session.user.id})
      RETURNING *
    `;
		return Response.json(todo);
	} catch (error) {
		console.error('Error creating todo:', error);
		return Response.json({ error: 'Failed to create todo' }, { status: 500 });
	}
}

export async function PUT(request) {
	try {
		const session = await auth();
		if (!session?.user) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, completed } = await request.json();
		if (!id) {
			return Response.json({ error: 'Todo ID is required' }, { status: 400 });
		}

		const [todo] = await sql`
      UPDATE todos 
      SET completed = ${completed}
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING *
    `;

		if (!todo) {
			return Response.json({ error: 'Todo not found' }, { status: 404 });
		}

		return Response.json(todo);
	} catch (error) {
		console.error('Error updating todo:', error);
		return Response.json({ error: 'Failed to update todo' }, { status: 500 });
	}
}

export async function DELETE(request) {
	try {
		const session = await auth();
		if (!session?.user) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await request.json();
		if (!id) {
			return Response.json({ error: 'Todo ID is required' }, { status: 400 });
		}

		const [todo] = await sql`
      DELETE FROM todos 
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING *
    `;

		if (!todo) {
			return Response.json({ error: 'Todo not found' }, { status: 404 });
		}

		return Response.json({ success: true });
	} catch (error) {
		console.error('Error deleting todo:', error);
		return Response.json({ error: 'Failed to delete todo' }, { status: 500 });
	}
}
