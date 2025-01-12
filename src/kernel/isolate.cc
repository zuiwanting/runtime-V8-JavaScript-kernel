// Copyright 2014 Runtime.JS project authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include "isolate.h"
#include <kernel/thread-manager.h>
#include <kernel/engines.h>
#include <kernel/string.h>
#include <kernel/resource.h>

namespace rt {

Isolate::Isolate(Engine* engine, uint32_t id, bool startup_script)
    :	engine_(engine),
        id_(id),
        startup_script_(startup_script),
        isolate_(v8::Isolate::New()),
        thread_manager_(nullptr),
        tpl_cache_(nullptr) {
    RT_ASSERT(engine_);
    RT_ASSERT(isolate_);

    isolate_->SetData(0, this);
    thread_manager_ = new ThreadManager(this);

    RT_ASSERT(thread_manager_);
}

/**
 * Isolate initialization performed on idle thread stack. Startup
 * stack may be too small for v8 compiler.
 */
void Isolate::Init() {
    if (nullptr == tpl_cache_) {
        v8::Isolate* iv8 = isolate_;
        v8::Locker lock(iv8);
        v8::Isolate::Scope ivscope(iv8);
        v8::HandleScope local_handle_scope(iv8);
        tpl_cache_ = new TemplateCache(this);
    }
    RT_ASSERT(tpl_cache_);
}

void Isolate::Enter() {

    ProcessNewThreads();
    RT_ASSERT(thread_manager_->has_threads()); // at least idle thread
    thread_manager_->Run();
}


void Isolate::NewThreads(SharedVector<ResourceHandle<EngineThread>> threads) {
    if (0 == threads.size()) return;

    for (ResourceHandle<EngineThread>& thread : threads) {
        thread.get()->thread_ = thread_manager_->CreateThread(
            String(),
            thread);
    }
}


void Isolate::ProcessNewThreads() {
    NewThreads(std::move(engine_->threads().TakeNewThreads()));
}

Thread* Isolate::current_thread() {
    return thread_manager_->current_thread();
}

void Isolate::TimerInterruptNotify() {
    ticks_counter_.AddFetch(1);
}

} // namespace rt
