// VENKY Code app tools that only read state stay available in Plan mode; every other app tool is blocked.
const PLAN_APP_TOOLS = new Set([
  'venky_title', 'venky_team_directory', 'venky_read_team_mailbox',
  'venky_list_tasks', 'venky_read_task', 'venky_search_tasks', 'venky_list_projects',
  'venky_list_workers', 'venky_read_worker', 'venky_list_subagents', 'venky_list_queue',
  'venky_list_local_servers', 'venky_list_moodboards', 'venky_read_moodboard', 'venky_read_moodboard_image',
  'venky_vm_list', 'venky_vm_screenshot', 'venky_simulator_devices', 'venky_simulator_describe',
  'venky_simulator_screenshot', 'venky_jev_read', 'venky_jev_list', 'venky_jev_screenshot',
  'venky_jev_assessments', 'venky_bot_recall', 'venky_bot_list_schedules', 'venky_code_search',
]);

export default async function (pi) {
  const config = JSON.parse(process.env.VENKYCODE_PI_BRIDGE);
  // The bearer token must not reach the commands Pi runs (they inherit this environment).
  delete process.env.VENKYCODE_PI_BRIDGE;
  const request = async (method, params, signal) => {
    const response = await fetch(config.url, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Authorization: config.authorization },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    if (!response.ok) throw new Error('VENKY Code tools connection failed.');
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    return result.result;
  };
  const tools = config.url ? (await request('tools/list', {})).tools : [];
  const names = new Set(tools.map(tool => tool.name));
  for (const tool of tools) {
    pi.registerTool({
      name: tool.name,
      label: tool.name,
      // omp hides extension tools behind discovery unless they are essential; Pi ignores this.
      loadMode: 'essential',
      description: tool.description,
      parameters: tool.inputSchema,
      async execute(_id, args, signal) {
        const result = await request('tools/call', { name: tool.name, arguments: args }, signal);
        if (result.isError) throw new Error(result.content.filter(item => item.type === 'text').map(item => item.text).join('\n'));
        return result;
      },
    });
  }
  pi.on('session_start', (_event, ctx) => ctx.ui.setStatus('venky-bridge', 'ready'));
  pi.on('tool_call', async (event, ctx) => {
    const app = names.has(event.toolName);
    if (['read', 'grep', 'find', 'ls'].includes(event.toolName) || (app && PLAN_APP_TOOLS.has(event.toolName))) return;
    if (config.mode === 'plan') return { block: true, reason: 'This tool is unavailable in Plan mode.' };
    if (app) return;
    if (config.mode === 'full') return;
    if (config.mode === 'auto' && ['edit', 'write'].includes(event.toolName)) return;
    try {
      if (await ctx.ui.confirm(`Allow ${event.toolName}?`, JSON.stringify(event.input).slice(0, 4000))) return;
    } catch {}
    return { block: true, reason: 'Declined by the user.' };
  });
}
