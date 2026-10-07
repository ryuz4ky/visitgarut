const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {PGlite}=require('@electric-sql/pglite');
function evaluate(file,dependencies){const module={exports:{}};const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(source,{module,exports:module.exports,require:name=>{if(name in dependencies)return dependencies[name];throw Error('Unexpected dependency '+name)},FormData,Date,URL,URLSearchParams,Array,Object,Number,String,Error,console},{filename:file});return module.exports}
const core=evaluate('lib/pulse/youtube-core.ts',{});
const item=(id,text)=>({snippet:{topLevelComment:{id,snippet:{authorDisplayName:'Test author',authorChannelId:{value:'author-'+id},textOriginal:text,publishedAt:'2026-10-06T01:00:00Z',likeCount:2}}}});
(async()=>{const pg=new PGlite();let inserted=0,failAt=0,released=0,authCalls=0,revalidated=0;let comments;
 try{
  const short='x'.repeat(11)+'😀'.repeat(8);assert.equal(short.length,27);assert.equal(Array.from(short).length,19);
  const original='x'.repeat(12)+'😀'.repeat(8);const normalized=core.normalizeYoutubeComments([item('short',short),item('valid',original),item('large','😀'.repeat(4001))],'pchsLOsOlD4');
  assert.equal(normalized.length,1);assert.equal(normalized[0].text,original);assert.equal(normalized[0].sourceUrl,'https://www.youtube.com/watch?v=pchsLOsOlD4&lc=valid');
  console.log('PASS Unicode length matches PostgreSQL without changing valid original text');
  assert.equal(core.youtubeApiErrorCode('commentsDisabled',403),'youtube_comments_disabled');assert.equal(core.youtubeApiErrorCode('quotaExceeded',403),'youtube_quota');assert.equal(core.youtubeApiErrorCode('videoNotFound',404),'youtube_video_unavailable');assert.equal(core.youtubeApiErrorCode('forbidden',403),'youtube_access');
  console.log('PASS Disabled comments, quota, unavailable video and access errors are distinct');
  for(const migration of ['db/001-mvp.sql','db/003-community-pulse.sql','db/004-place-research.sql'])await pg.exec(fs.readFileSync(migration,'utf8'));
  const place=(await pg.query("INSERT INTO vg_places(slug,name,category,excerpt,status) VALUES('youtube-test','YouTube test','wisata','Test fixture','published') RETURNING id")).rows[0];
  const content=(await pg.query("INSERT INTO vg_social_contents(place_id,platform,source_url,source_post_id,title,status) VALUES($1,'youtube','https://www.youtube.com/watch?v=pchsLOsOlD4','pchsLOsOlD4','Test video','approved') RETURNING id",[place.id])).rows[0];
  const query=async(sql,args)=>{if(sql.startsWith('INSERT INTO vg_social_mentions')&&++inserted===failAt)throw Error('Injected storage failure');return pg.query(sql,args)};
  const client={query,release:()=>{released++}};const database={query,connect:async()=>client};
  comments=core.normalizeYoutubeComments([item('first',original),item('second','A second visitor comment with sufficient length.')],'pchsLOsOlD4');
  const actions=evaluate('app/admin/pulse/actions.ts',{'node:crypto':require('node:crypto'),'next/navigation':{redirect:location=>{throw Object.assign(Error('redirect'),{location})}},'next/cache':{revalidatePath:()=>{revalidated++}},'@/lib/mvp/db':{db:()=>database},'@/lib/mvp/auth':{requireAdmin:async()=>{authCalls++}},'@/lib/site':{absoluteUrl:p=>'https://visitgarut.com'+p},'@/lib/pulse/contribution':{},'@/lib/pulse/core':{sensitivePattern:/calo/i},'@/lib/pulse/data':{},'@/lib/pulse/youtube':{fetchYoutubeComments:async()=>comments},'@/lib/pulse/youtube-core':core});
  const run=async(consent='yes')=>{const form=new FormData();form.set('content_id',String(content.id));form.set('api_consent',consent);try{await actions.syncYoutube(form);assert.fail('Expected redirect')}catch(e){assert.ok(e.location);return e.location}};
  assert.equal(await run('no'),'/admin/pulse?tab=content&error=youtube_consent');assert.equal((await pg.query('SELECT count(*)::int AS n FROM vg_social_mentions')).rows[0].n,0);
  assert.equal(await run(),'/admin/pulse?synced=2');assert.equal((await pg.query("SELECT count(*)::int AS n FROM vg_social_mentions WHERE status='pending' AND analysis_allowed=false")).rows[0].n,2);assert.equal(revalidated,1);
  assert.equal((await pg.query('SELECT length(original_text)::int AS n FROM vg_social_mentions WHERE source_key=\'first\'')).rows[0].n,20);
  console.log('PASS Actual import action stores valid emoji comments pending and blocks missing consent');
  inserted=0;failAt=2;comments=[{...comments[0],text:'Changed text that must roll back entirely.'},{...comments[1],id:'third'}];
  assert.equal(await run(),'/admin/pulse?tab=content&error=youtube_storage');assert.equal((await pg.query('SELECT count(*)::int AS n FROM vg_social_mentions')).rows[0].n,2);assert.equal((await pg.query("SELECT original_text FROM vg_social_mentions WHERE source_key='first'")).rows[0].original_text,original);assert.equal(revalidated,1);assert.equal(released,2);assert.equal(authCalls,3);
  console.log('PASS Storage failure rolls back additions and updates and releases connection');
 }finally{await pg.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
