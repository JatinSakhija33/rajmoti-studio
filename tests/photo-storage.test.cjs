const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
const vm=require('node:vm');
function pipeline(options={}){
 const uploaded=[],removed=[];let n=0;
 const bucket={upload:async(path,_blob,config)=>{assert.equal(config.upsert,false);n++;if(options.failUpload===n)return {error:new Error('upload interrupted')};uploaded.push(path);return {error:null}},createSignedUrl:async(path)=>options.failSigning?{error:new Error('signing failed')}:{data:{signedUrl:'https://example.invalid/'+path},error:null},list:async()=>({data:options.missing?[]:uploaded.map(path=>({name:path.split('/').pop()})),error:null}),remove:async(paths)=>{removed.push(...paths);return {error:null}}};
 const exports={};const source=ts.transpileModule(fs.readFileSync('src/lib/images.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{exports,require:()=>({supabase:{storage:{from:()=>bucket}}}),Blob,console,...options.canvas});return {api:exports,uploaded,removed};
}
const processed={variants:[{key:'thumbnail',blob:new Blob(['test']),width:400,height:300},{key:'original',blob:new Blob(['test']),width:800,height:600}]};
test('upload failure cleans only new objects already written',async()=>{const x=pipeline({failUpload:2});await assert.rejects(x.api.uploadVariants('category','photo/revision',processed),/upload interrupted/);assert.deepEqual(x.removed,['category/photo/revision/thumbnail.webp'])});
test('signing failure cleans the just-uploaded object',async()=>{const x=pipeline({failSigning:true});await assert.rejects(x.api.uploadVariants('category','photo/revision',processed),/signing failed/);assert.deepEqual(x.removed,['category/photo/revision/thumbnail.webp'])});
test('verification failure cleans all new objects',async()=>{const x=pipeline({missing:true});await assert.rejects(x.api.uploadVariants('category','photo/revision',processed),/missing/);assert.equal(x.removed.length,2)});
test('successful versioned uploads do not delete previous files',async()=>{const x=pipeline();const result=await x.api.uploadVariants('category','photo/revision',processed);assert.equal(result.original.path,'category/photo/revision/original.webp');assert.equal(x.removed.length,0)});
test('unsupported files and oversized files are rejected',()=>{const {api}=pipeline();assert.throws(()=>api.validatePhoto({type:'image/svg+xml',size:10}),/JPG/);assert.throws(()=>api.validatePhoto({type:'image/png',size:26*1024*1024}),/25 MB/)});

test('large source uploads enforce the two browsing budgets and retain full-screen quality', async () => {
  let closed = false;
  const { api } = pipeline({
    canvas: {
      createImageBitmap: async () => ({
        width: 6000,
        height: 4000,
        close() { closed = true; },
      }),
      document: {
        createElement: () => ({
          getContext: () => ({
            drawImage() {},
            getImageData: () => ({ data: [232, 226, 212, 255] }),
          }),
          toBlob(callback, type, quality) {
            callback(new Blob([Buffer.alloc(Math.ceil(this.width * this.height * quality))], { type }));
          },
        }),
      },
    },
  });
  const source = new Blob([Buffer.alloc(8 * 1024 * 1024)], { type: 'image/jpeg' });
  const result = await api.processImage(source);
  const [thumbnail, medium, large, original] = result.variants;
  assert.ok(thumbnail.blob.size <= 50 * 1024);
  assert.ok(medium.blob.size <= 100 * 1024);
  assert.ok(medium.width < 800, 'detailed photos can resize again to meet the budget');
  assert.equal(large.width, 1600);
  assert.equal(original.width, 2560);
  assert.equal(original.blob.type, 'image/webp');
  assert.equal(source.size, 8 * 1024 * 1024);
  assert.equal(closed, true);
});
