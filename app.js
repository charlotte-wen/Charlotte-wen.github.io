                                                                                                                                                                                                        // 可编辑 JavaScript 课堂笔记系统（拆分自 index.html 内联脚本）

// 初始数据
let notebookData = {
  sections: [
    {
      id: 'section1',
      title: 'JavaScript基础',
      content: 'JavaScript是一种轻量级的解释型编程语言，主要用于Web开发，为网页添加交互功能。',
      notes: [
        {
          content: '注意：JavaScript 与 Java 是完全不同的语言，无论在概念上还是设计上。',
        },
      ],
      codeBlocks: [
        {
          title: '第一个JavaScript程序',
          description: '在浏览器中运行JavaScript的最简单方式：',
          code: "// 在控制台输出信息\nconsole.log(\"Hello, JavaScript!\");\n\n// 在页面上显示信息\ndocument.write(\"<h3>Welcome to JavaScript!</h3>\");\n\n// 弹出对话框\nalert(\"JavaScript is awesome!\");",
        },
      ],
    },
    {
      id: 'section2',
      title: '变量与数据类型',
      content: 'JavaScript 变量用于存储数据值。使用 var, let 或 const 来声明变量。',
      notes: [],
      codeBlocks: [
        {
          title: '变量声明示例',
          description: '',
          code: "// 使用var声明变量 (函数作用域)\nvar name = 'John';\n\n// 使用let声明变量 (块级作用域)\nlet age = 30;\n\n// 使用const声明常量\nconst PI = 3.14159;\n\n// 数据类型示例\nlet isStudent = true; // 布尔值\nlet fruits = ['Apple', 'Banana', 'Orange']; // 数组\nlet person = {firstName: 'Jane', lastName: 'Doe'}; // 对象\nlet emptyValue = null; // null\nlet notDefined; // undefined\n\nconsole.log(`Name: ${name}, Age: ${age}`);\nconsole.log(`PI: ${PI}, Is student: ${isStudent}`);\nconsole.log(`Fruits: ${fruits.join(', ')}`);\nconsole.log(`Person: ${person.firstName} ${person.lastName}`);",
        },
        {
          title: '错误处理示例',
          description: '演示不同类型的JavaScript错误以及严格模式的效果：',
          code: "// 1. 正常代码（会成功执行）\nconsole.log('这是正常的代码执行');\n\n// 2. 取消下面的注释来测试不同类型的错误：\n\n// 语法错误示例（取消注释测试）：\n// let x = ;\n\n// 引用错误示例（取消注释测试）：\n// console.log(undefinedVariable);\n\n// 类型错误示例（取消注释测试）：\n// let num = null;\n// num.toUpperCase();\n\n// 严格模式错误示例（取消注释测试）：\n// 在严格模式下，未声明的变量会报错\n// strictModeTest = '这会在严格模式下报错';\n\nconsole.log('代码执行完成！');",
        },
      ],
    },
  ],
};

// CodeMirror 实例
let codeEditors = [];

// DOM 元素
const mainContent = document.getElementById('mainContent');
const tocList = document.getElementById('tocList');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const emptyState = document.getElementById('emptyState');
const addFirstSectionBtn = document.getElementById('addFirstSectionBtn');

function initApp() {
  const savedData = localStorage.getItem('jsNotebook');
  if (savedData) {
    try {
      notebookData = JSON.parse(savedData);
      // 清理被过度转义的代码
      cleanupEscapedCode();
      // 验证和修复章节ID
      validateAndFixSectionIds();
    } catch (e) {
      console.error('Error parsing saved data', e);
    }
  }

  renderToc();
  renderContent();
  setupEventListeners();
}

function validateAndFixSectionIds() {
  let hasChanges = false;
  
  // 确保所有章节都有有效的ID
  notebookData.sections.forEach((section, index) => {
    if (!section.id || section.id.trim() === '') {
      // 生成新的唯一ID
      let newId = `section${index + 1}`;
      let counter = index + 1;
      while (notebookData.sections.some((s, i) => i !== index && s.id === newId)) {
        counter++;
        newId = `section${counter}`;
      }
      section.id = newId;
      console.log(`修复章节ID: ${section.title} -> ${newId}`);
      hasChanges = true;
    }
  });
  
  // 检查是否有重复的ID
  const ids = notebookData.sections.map(s => s.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    console.warn('发现重复的章节ID，正在修复...', duplicates);
    notebookData.sections.forEach((section, index) => {
      if (duplicates.includes(section.id)) {
        let newId = `section${index + 1}`;
        let counter = index + 1;
        while (notebookData.sections.some((s, i) => i !== index && s.id === newId)) {
          counter++;
          newId = `section${counter}`;
        }
        section.id = newId;
        console.log(`修复重复ID: ${section.title} -> ${newId}`);
      }
    });
    hasChanges = true;
  }
  
  // 如果有任何修复，保存数据
  if (hasChanges) {
    localStorage.setItem('jsNotebook', JSON.stringify(notebookData));
    console.log('章节ID修复完成，数据已保存');
  }
}

function cleanupEscapedCode() {
  // 清理被过度转义的代码内容
  notebookData.sections.forEach(section => {
    if (section.codeBlocks) {
      section.codeBlocks.forEach(codeBlock => {
        if (codeBlock.code) {
          let code = codeBlock.code;
          
          // 多次清理，处理深度嵌套的转义
          let prevCode;
          do {
            prevCode = code;
            code = code
              .replace(/\\\\\\\\/g, '\\\\')  // 四个反斜杠变两个
              .replace(/\\\\\\\\/g, '\\\\')  // 再次处理四个反斜杠变两个
              .replace(/\\\\\\\$/g, '\\$')   // 三个反斜杠+$变一个反斜杠+$
              .replace(/\\\\\\\`/g, '\\`')   // 三个反斜杠+`变一个反斜杠+`
              .replace(/\\\\\\\{/g, '\\{')   // 三个反斜杠+{变一个反斜杠+{
              .replace(/\\\\\$/g, '$')       // 两个反斜杠+$变$
              .replace(/\\\\\`/g, '`')       // 两个反斜杠+`变`
              .replace(/\\\\\{/g, '{')       // 两个反斜杠+{变{
              .replace(/\\\$/g, '$')         // 一个反斜杠+$变$
              .replace(/\\\`/g, '`')         // 一个反斜杠+`变`
              .replace(/\\\{/g, '{')         // 一个反斜杠+{变{
              .replace(/\\\$\\\{/g, '${')    // \$\{变${
              .replace(/\\\\\$\\\\\{/g, '${'); // \\$\\{变${
          } while (code !== prevCode); // 重复直到没有变化
          
          codeBlock.code = code;
        }
      });
    }
  });
}

function escapeForTemplate(str) {
  // 专用于文本内容（标题、描述等），不用于代码内容
  const s = String(str);
  const endScript = new RegExp('</scr' + 'ipt>', 'gi');
  return s.replace(endScript, '</scr' + 'ipt>');
}

function escapeForHtmlAttribute(str) {
  // 专门为HTML属性转义，避免破坏代码内容
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderToc() {
  tocList.innerHTML = '';
  if (notebookData.sections.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  notebookData.sections.forEach((section, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="#${section.id}" class="toc-link ${index === 0 ? 'active' : ''}" data-section-id="${section.id}">${escapeForTemplate(section.title)}</a>
      <div class="toc-actions">
        <button class="toc-btn move-up-btn" data-id="${section.id}" ${index === 0 ? 'disabled="disabled"' : ''}><i class="fas fa-arrow-up"></i></button>
        <button class="toc-btn move-down-btn" data-id="${section.id}" ${index === notebookData.sections.length - 1 ? 'disabled="disabled"' : ''}><i class="fas fa-arrow-down"></i></button>
        <button class="toc-btn delete-btn" data-id="${section.id}"><i class="fas fa-trash"></i></button>
      </div>`;
    tocList.appendChild(li);
  });
}

function renderContent() {
  mainContent.innerHTML = '';
  codeEditors = [];
  if (notebookData.sections.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  notebookData.sections.forEach((section, sectionIndex) => {
    const sectionEl = document.createElement('section');
    sectionEl.id = section.id;
    sectionEl.className = 'section note-section';

    let notesHtml = '';
    if (section.notes && section.notes.length > 0) {
      section.notes.forEach((note) => {
        notesHtml += `
          <div class="note-box">
            <strong><i class="fas fa-lightbulb"></i> 注意：</strong>
            <span class="editable" contenteditable="true">${escapeForTemplate(note.content)}</span>
          </div>`;
      });
    }

    let codeBlocksHtml = '';
    if (section.codeBlocks && section.codeBlocks.length > 0) {
      section.codeBlocks.forEach((codeBlock, codeIndex) => {
        codeBlocksHtml += `
          <h3><i class="fas fa-code"></i> <span class="editable code-title" contenteditable="true">${escapeForTemplate(codeBlock.title)}</span></h3>
          ${codeBlock.description ? `<p class="editable" contenteditable="true">${escapeForTemplate(codeBlock.description)}</p>` : ''}
          <div class="code-container">
            <div class="code-header">
              <span>示例代码 ${sectionIndex + 1}.${codeIndex + 1}</span>
              <div class="code-actions">
                <button class="copy-code-btn"><i class="fas fa-copy"></i> 复制代码</button>
                <button class="run-btn"><i class="fas fa-play"></i> 运行代码</button>
                <button class="clear-output-btn"><i class="fas fa-eraser"></i> 清除结果</button>
                <button class="move-code-up-btn" data-section="${sectionIndex}" data-index="${codeIndex}" ${codeIndex === 0 ? 'disabled="disabled"' : ''}><i class="fas fa-arrow-up"></i></button>
                <button class="move-code-down-btn" data-section="${sectionIndex}" data-index="${codeIndex}" ${codeIndex === section.codeBlocks.length - 1 ? 'disabled="disabled"' : ''}><i class="fas fa-arrow-down"></i></button>
                <button class="btn btn-danger delete-code-btn" data-section="${sectionIndex}" data-index="${codeIndex}"><i class="fas fa-trash"></i></button>
              </div>
            </div>
            <textarea class="code-editor" id="editor-${sectionIndex}-${codeIndex}" style="display: none;">${escapeForHtmlAttribute(codeBlock.code)}</textarea>
            <div class="output-container">
              <div class="output-title"><i class="fas fa-terminal"></i> 输出结果：</div>
              <div class="output-content"></div>
            </div>
          </div>`;
      });
    }

    sectionEl.innerHTML = `
      <div class="section-actions">
        <button class="section-btn add-note-btn" data-section="${sectionIndex}"><i class="fas fa-sticky-note"></i> 添加注释</button>
        <button class="section-btn add-code-btn" data-section="${sectionIndex}"><i class="fas fa-code"></i> 添加代码</button>
        <button class="section-btn delete-section-btn" data-section="${sectionIndex}"><i class="fas fa-trash"></i> 删除章节</button>
      </div>
      <h2><i class="fas fa-star"></i> <span class="editable" contenteditable="true">${escapeForTemplate(section.title)}</span></h2>
      <p class="editable" contenteditable="true">${escapeForTemplate(section.content)}</p>
      ${notesHtml}
      ${codeBlocksHtml}
      <div class="code-container add-code-container" style="margin-top: 30px; text-align: center; background: #f8f9fa; border: 2px dashed #3498db; cursor: pointer;" data-section="${sectionIndex}">
        <div style="padding: 30px; color: #3498db;">
          <i class="fas fa-plus-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <h3>添加新的代码示例</h3>
        </div>
      </div>`;

    mainContent.appendChild(sectionEl);
  });

  setTimeout(() => {
    document.querySelectorAll('.code-editor').forEach((textarea) => {
      const editor = CodeMirror.fromTextArea(textarea, {
        mode: 'javascript',
        theme: 'dracula',
        lineNumbers: true,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        extraKeys: {
          "Ctrl-/": function(cm) { toggleComment(cm); },
          "Cmd-/": function(cm) { toggleComment(cm); } // Mac支持
        }
      });
      codeEditors.push(editor);
    });
  }, 100);
}

function setupEventListeners() {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    // 更新图标状态
    const icon = sidebarToggle.querySelector('i');
    if (sidebar.classList.contains('active')) {
      icon.className = 'fas fa-times';
    } else {
      icon.className = 'fas fa-bars';
    }
  });

  // 点击侧边栏外部关闭侧边栏（移动端）
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        !sidebarToggle.contains(e.target) && 
        sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
      sidebarToggle.querySelector('i').className = 'fas fa-bars';
    }
  });

  document.getElementById('newSectionBtn').addEventListener('click', addNewSection);
  addFirstSectionBtn.addEventListener('click', addNewSection);

  document.getElementById('saveBtn').addEventListener('click', saveNotebook);
  document.getElementById('exportBtn').addEventListener('click', exportHtml);
  document.getElementById('importBtn').addEventListener('click', showImportModal);
  document.getElementById('exportDataBtn').addEventListener('click', exportNotebookData);

  // 修复代码按钮
  document.getElementById('fixCodeBtn').addEventListener('click', () => {
    cleanupEscapedCode();
    saveNotebookData(); // 保存清理后的数据
    renderContent(); // 重新渲染内容
    showNotification('代码转义问题已修复！', 'success');
  });

  // 回到顶部按钮功能
  const backToTopBtn = document.getElementById('backToTopBtn');
  
  // 监听页面滚动（使用优化的节流函数）
  window.addEventListener('scroll', throttledScrollHandler);

  // 点击回到顶部
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // 双击回到顶部（立即滚动，无动画）
  backToTopBtn.addEventListener('dblclick', () => {
    window.scrollTo({
      top: 0,
      behavior: 'auto'
    });
  });

  // 目录章节跳转功能 - 优化版本
  tocList.addEventListener('click', (e) => {
    if (e.target.closest('.toc-link')) {
      e.preventDefault(); // 阻止默认的锚点跳转
      
      const link = e.target.closest('.toc-link');
      const sectionId = link.dataset.sectionId;
      const targetSection = document.getElementById(sectionId);
      
      if (targetSection) {
        // 计算目标位置（考虑固定头部的高度）
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = targetSection.offsetTop - headerHeight - 20;
        
        // 平滑滚动到目标章节
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // 更新活跃状态
        document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // 在移动设备上自动关闭侧边栏
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('active');
          sidebarToggle.querySelector('i').className = 'fas fa-bars';
        }
        
        // 添加视觉反馈
        targetSection.style.borderLeftColor = 'var(--accent)';
        targetSection.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.3)';
        setTimeout(() => {
          targetSection.style.borderLeftColor = '';
          targetSection.style.boxShadow = '';
        }, 2000);
      } else {
        // 显示错误提示
        showNotification(`无法找到章节: ${sectionId}`, 'error');
      }
    }
  });

      document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('确定要重置所有内容吗？这将清除所有自定义内容。')) {
      localStorage.removeItem('jsNotebook');
      location.reload();
    }
  });

  // 统计按钮事件监听器
  document.getElementById('statsBtn').addEventListener('click', showSectionStats);

  document.getElementById('newTocBtn').addEventListener('click', addNewSection);

  mainContent.addEventListener('click', (e) => {
    if (e.target.closest('.copy-code-btn')) {
      const codeContainer = e.target.closest('.code-container');
      const editorArea = codeContainer.querySelector('.CodeMirror');
      
      if (editorArea && editorArea.CodeMirror) {
        const code = editorArea.CodeMirror.getValue();
        
        // 使用现代剪贴板API或回退到传统方法
        if (navigator.clipboard && window.isSecureContext) {
          // 现代浏览器的异步剪贴板API
          navigator.clipboard.writeText(code).then(() => {
            showCopySuccess(e.target.closest('.copy-code-btn'));
          }).catch(err => {
            console.error('复制失败:', err);
            // 回退到传统方法
            fallbackCopyToClipboard(code, e.target.closest('.copy-code-btn'));
          });
        } else {
          // 传统的复制方法
          fallbackCopyToClipboard(code, e.target.closest('.copy-code-btn'));
        }
      } else {
        showNotification('无法获取代码内容', 'error');
      }
    }

    if (e.target.closest('.run-btn')) {
      const codeContainer = e.target.closest('.code-container');
      const outputContainer = codeContainer.querySelector('.output-container');
      const outputContent = outputContainer.querySelector('.output-content');
      outputContainer.style.display = 'block';
      outputContent.innerHTML = '';
      const originalLog = console.log;
      console.log = function (...args) {
        originalLog.apply(console, args);
        args.forEach((arg) => {
          outputContent.innerHTML += `<div>${String(arg)}</div>`;
        });
      };
      try {
        const editorArea = codeContainer.querySelector('.CodeMirror');
        const code = editorArea ? editorArea.CodeMirror.getValue() : '';
        
        // 确保代码在严格模式下运行
        const strictCode = `'use strict';\n${code}`;
        
        // 创建函数并执行
        const result = new Function(strictCode);
        result();
        
        // 如果代码执行成功但没有输出，显示成功消息
        if (outputContent.innerHTML.trim() === '') {
          outputContent.innerHTML = '<div style="color: #27ae60;"><i class="fas fa-check-circle"></i> 代码执行成功（无输出）</div>';
        }
      } catch (error) {
        // 详细的错误处理
        let errorMessage = error.message;
        let errorType = error.name || '错误';
        
        // 常见错误类型的中文提示
        if (error instanceof SyntaxError) {
          errorType = '语法错误';
        } else if (error instanceof ReferenceError) {
          errorType = '引用错误';
        } else if (error instanceof TypeError) {
          errorType = '类型错误';
        } else if (error instanceof RangeError) {
          errorType = '范围错误';
        }
        
        outputContent.innerHTML = `
          <div style="color: var(--danger); padding: 10px; background: rgba(231, 76, 60, 0.1); border-radius: 5px; border-left: 4px solid var(--danger);">
            <div style="font-weight: bold; margin-bottom: 5px;">
              <i class="fas fa-exclamation-triangle"></i> ${errorType}
            </div>
            <div style="font-family: monospace; font-size: 0.9em;">
              ${errorMessage}
            </div>
          </div>
        `;
      } finally {
        console.log = originalLog;
      }
    }

    if (e.target.closest('.clear-output-btn')) {
      const codeContainer = e.target.closest('.code-container');
      const outputContainer = codeContainer.querySelector('.output-container');
      const outputContent = outputContainer.querySelector('.output-content');
      outputContent.innerHTML = '';
      outputContainer.style.display = 'none';
    }

    if (e.target.closest('.add-note-btn')) {
      const sectionIndex = e.target.closest('.add-note-btn').dataset.section;
      addNoteToSection(parseInt(sectionIndex));
    }

    if (e.target.closest('.add-code-btn') || e.target.closest('.add-code-container')) {
      const btn = e.target.closest('.add-code-btn') || e.target.closest('.add-code-container');
      const sectionIndex = btn.dataset.section;
      addCodeBlockToSection(parseInt(sectionIndex));
    }

    if (e.target.closest('.delete-code-btn')) {
      const btn = e.target.closest('.delete-code-btn');
      const sectionIndex = parseInt(btn.dataset.section);
      const codeIndex = parseInt(btn.dataset.index);
      if (confirm('确定要删除这个代码示例吗？')) {
        notebookData.sections[sectionIndex].codeBlocks.splice(codeIndex, 1);
        saveNotebook();
        renderContent();
      }
    }

    if (e.target.closest('.move-code-up-btn')) {
      const btn = e.target.closest('.move-code-up-btn');
      if (btn.disabled) return; // 如果按钮被禁用，直接返回
      const sectionIndex = parseInt(btn.dataset.section);
      const codeIndex = parseInt(btn.dataset.index);
      if (codeIndex > 0) {
        const codeBlocks = notebookData.sections[sectionIndex].codeBlocks;
        [codeBlocks[codeIndex - 1], codeBlocks[codeIndex]] = 
        [codeBlocks[codeIndex], codeBlocks[codeIndex - 1]];
        saveNotebookData();
        renderContent();
        showNotification('代码示例已向上移动！', 'success');
      }
    }

    if (e.target.closest('.move-code-down-btn')) {
      const btn = e.target.closest('.move-code-down-btn');
      if (btn.disabled) return; // 如果按钮被禁用，直接返回
      const sectionIndex = parseInt(btn.dataset.section);
      const codeIndex = parseInt(btn.dataset.index);
      const codeBlocks = notebookData.sections[sectionIndex].codeBlocks;
      if (codeIndex < codeBlocks.length - 1) {
        [codeBlocks[codeIndex], codeBlocks[codeIndex + 1]] = 
        [codeBlocks[codeIndex + 1], codeBlocks[codeIndex]];
        saveNotebookData();
        renderContent();
        showNotification('代码示例已向下移动！', 'success');
      }
    }

    if (e.target.closest('.delete-section-btn')) {
      const sectionIndex = e.target.closest('.delete-section-btn').dataset.section;
      if (notebookData.sections.length > 1 && confirm('确定要删除这个章节吗？')) {
        notebookData.sections.splice(sectionIndex, 1);
        saveNotebookData();
        renderToc();
        renderContent();
      } else if (notebookData.sections.length === 1) {
        alert('至少需要保留一个章节');
      }
    }
  });

  tocList.addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn')) {
      const sectionId = e.target.closest('.delete-btn').dataset.id;
      const sectionIndex = notebookData.sections.findIndex((s) => s.id === sectionId);
      if (notebookData.sections.length > 1 && confirm('确定要删除这个章节吗？')) {
        notebookData.sections.splice(sectionIndex, 1);
        saveNotebookData();
        renderToc();
        renderContent();
      } else if (notebookData.sections.length === 1) {
        alert('至少需要保留一个章节');
      }
    }

    if (e.target.closest('.move-up-btn')) {
      const btn = e.target.closest('.move-up-btn');
      if (btn.disabled) return; // 如果按钮被禁用，直接返回
      const sectionId = btn.dataset.id;
      const sectionIndex = notebookData.sections.findIndex((s) => s.id === sectionId);
      if (sectionIndex > 0) {
        [notebookData.sections[sectionIndex - 1], notebookData.sections[sectionIndex]] = 
        [notebookData.sections[sectionIndex], notebookData.sections[sectionIndex - 1]];
        saveNotebookData();
        renderToc();
        renderContent();
      }
    }

    if (e.target.closest('.move-down-btn')) {
      const btn = e.target.closest('.move-down-btn');
      if (btn.disabled) return; // 如果按钮被禁用，直接返回
      const sectionId = btn.dataset.id;
      const sectionIndex = notebookData.sections.findIndex((s) => s.id === sectionId);
      if (sectionIndex < notebookData.sections.length - 1) {
        [notebookData.sections[sectionIndex], notebookData.sections[sectionIndex + 1]] = 
        [notebookData.sections[sectionIndex + 1], notebookData.sections[sectionIndex]];
        saveNotebookData();
        renderToc();
        renderContent();
      }
    }

    if (e.target.closest('.toc a')) {
      e.preventDefault();
      const targetId = e.target.closest('.toc a').getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({ top: targetElement.offsetTop - 20, behavior: 'smooth' });
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('active');
        }
      }
    }
  });

  // 实时保存编辑内容（防抖）
  let saveTimeout;
  mainContent.addEventListener('input', (e) => {
    if (e.target.classList.contains('editable')) {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveEditableContent();
        // 立即保存到localStorage
        localStorage.setItem('jsNotebook', JSON.stringify(notebookData));
      }, 1000);
      
      // 如果是章节标题发生变化，立即更新目录
      if (e.target.closest('h2') && e.target.classList.contains('editable')) {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          saveEditableContent();
          localStorage.setItem('jsNotebook', JSON.stringify(notebookData));
        }, 500); // 章节标题变化时使用更短的延迟
      }
    }
  });

  // 添加键盘快捷键
  document.addEventListener('keydown', (e) => {
    // Ctrl+S 保存笔记
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault(); // 阻止浏览器默认的保存页面行为
      saveNotebook();
      return;
    }
    
    // Ctrl+N 添加新章节
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      addNewSection();
      return;
    }
    
    // Ctrl+E 导出HTML
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      exportHtml();
      return;
    }
    
    // F1 显示快捷键帮助
    if (e.key === 'F1') {
      e.preventDefault();
      showKeyboardShortcuts();
      return;
    }
    
    // Ctrl+Shift+N 添加新注释
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      // 找到当前可见的章节并添加注释
      const visibleSection = findVisibleSectionEnhanced();
      if (visibleSection !== -1) {
        addNoteToSection(visibleSection);
      }
      return;
    }
    
    // Ctrl+Shift+C 添加新代码块
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      // 找到当前可见的章节并添加代码块
      const visibleSection = findVisibleSectionEnhanced();
      if (visibleSection !== -1) {
        addCodeBlockToSection(visibleSection);
      }
      return;
    }
    
    // Ctrl+Shift+S 显示章节统计
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      showSectionStats();
      return;
    }
    
    // ESC 关闭侧边栏（移动端）
    if (e.key === 'Escape' && window.innerWidth <= 768 && sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
      sidebarToggle.querySelector('i').className = 'fas fa-bars';
      return;
    }
  });
}

function addNewSection() {
  // 生成唯一的章节ID，避免重复
  let newSectionId;
  let sectionCount = 1;
  do {
    newSectionId = `section${sectionCount}`;
    sectionCount++;
  } while (notebookData.sections.some(s => s.id === newSectionId));
  
  const newSection = {
    id: newSectionId,
    title: `新章节 ${notebookData.sections.length + 1}`,
    content: '在此处添加章节描述...',
    notes: [],
    codeBlocks: [
      {
        title: '示例代码',
        description: '在此处添加代码描述',
        code: "// 在此处添加您的JavaScript代码\nconsole.log('Hello, JavaScript!');",
      },
    ],
  };
  notebookData.sections.push(newSection);
  saveNotebook();
  renderToc();
  renderContent();
  
  // 确保DOM更新后再滚动到新章节
  setTimeout(() => {
    const targetElement = document.getElementById(newSectionId);
    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // 更新目录中的活跃状态
      document.querySelectorAll('.toc-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.sectionId === newSectionId) {
          link.classList.add('active');
        }
      });
      
      // 在移动设备上自动关闭侧边栏
      if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        sidebar.classList.remove('show');
        sidebarToggle.querySelector('i').className = 'fas fa-bars';
      }
    } else {
      // 如果找不到元素，尝试用更长的延迟再次查找
      setTimeout(() => {
        const retryElement = document.getElementById(newSectionId);
        if (retryElement) {
          retryElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          
          // 更新目录中的活跃状态
          document.querySelectorAll('.toc-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.sectionId === newSectionId) {
              link.classList.add('active');
            }
          });
        }
      }, 500);
    }
  }, 100); // 先用较短的延迟尝试
}

function addNoteToSection(sectionIndex) {
  if (!notebookData.sections[sectionIndex].notes) {
    notebookData.sections[sectionIndex].notes = [];
  }
  
  // 记录当前滚动位置
  const currentScrollY = window.pageYOffset;
  
  notebookData.sections[sectionIndex].notes.push({ content: '在此处添加重要注释...' });
  saveNotebook();
  renderContent();
  
  // 在内容重新渲染后，保持在合适的位置
  setTimeout(() => {
    const section = document.getElementById(notebookData.sections[sectionIndex].id);
    if (section) {
      // 找到该章节的最后一个注释框（新添加的）
      const noteBoxes = section.querySelectorAll('.note-box');
      const newNoteBox = noteBoxes[noteBoxes.length - 1];
      
      if (newNoteBox) {
        // 平滑滚动到新添加的注释
        newNoteBox.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      } else {
        // 如果找不到新注释，保持在当前位置
        window.scrollTo({
          top: currentScrollY,
          behavior: 'auto'
        });
      }
    } else {
      // 如果找不到章节，保持在当前位置
      window.scrollTo({
        top: currentScrollY,
        behavior: 'auto'
      });
    }
  }, 200);
}

function addCodeBlockToSection(sectionIndex) {
  if (!notebookData.sections[sectionIndex].codeBlocks) {
    notebookData.sections[sectionIndex].codeBlocks = [];
  }
  
  // 记录当前滚动位置
  const currentScrollY = window.pageYOffset;
  
  const codeBlockCount = notebookData.sections[sectionIndex].codeBlocks.length + 1;
  notebookData.sections[sectionIndex].codeBlocks.push({
    title: `新代码示例 ${codeBlockCount}`,
    description: '在此处添加代码描述',
    code: "// 在此处添加您的JavaScript代码\nconsole.log('Hello, JavaScript!');",
  });
  saveNotebook();
  renderContent();
  
  // 在内容重新渲染后，滚动到新添加的代码块
  setTimeout(() => {
    const section = document.getElementById(notebookData.sections[sectionIndex].id);
    if (section) {
      // 找到该章节的最后一个代码容器（新添加的）
      const codeContainers = section.querySelectorAll('.code-container:not(.add-code-container)');
      const newCodeContainer = codeContainers[codeContainers.length - 1];
      
      if (newCodeContainer) {
        // 平滑滚动到新添加的代码块
        newCodeContainer.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      } else {
        // 如果找不到新代码块，至少保持在当前位置
        window.scrollTo({
          top: currentScrollY,
          behavior: 'auto'
        });
      }
    } else {
      // 如果找不到章节，保持在当前位置
      window.scrollTo({
        top: currentScrollY,
        behavior: 'auto'
      });
    }
  }, 200); // 稍微增加延迟确保DOM完全更新
}

function saveEditableContent() {
  let titleChanged = false;
  
  document.querySelectorAll('.section').forEach((sectionEl, sectionIndex) => {
    const titleEl = sectionEl.querySelector('h2 .editable');
    const contentEl = sectionEl.querySelector('p.editable');
    if (titleEl && contentEl) {
      const oldTitle = notebookData.sections[sectionIndex].title;
      const newTitle = titleEl.textContent;
      
      notebookData.sections[sectionIndex].title = newTitle;
      notebookData.sections[sectionIndex].content = contentEl.textContent;
      
      // 检查标题是否发生变化
      if (oldTitle !== newTitle) {
        titleChanged = true;
      }
    }
    const noteEls = sectionEl.querySelectorAll('.note-box .editable');
    noteEls.forEach((noteEl, noteIndex) => {
      if (notebookData.sections[sectionIndex].notes[noteIndex]) {
        notebookData.sections[sectionIndex].notes[noteIndex].content = noteEl.textContent;
      }
    });
    // 保存代码块标题
    const codeTitleEls = sectionEl.querySelectorAll('.code-title.editable');
    codeTitleEls.forEach((titleEl, titleIndex) => {
      if (notebookData.sections[sectionIndex].codeBlocks[titleIndex]) {
        notebookData.sections[sectionIndex].codeBlocks[titleIndex].title = titleEl.textContent;
      }
    });
    
    // 保存代码描述
    const codeDescEls = sectionEl.querySelectorAll('.code-container p.editable');
    codeDescEls.forEach((descEl, descIndex) => {
      if (notebookData.sections[sectionIndex].codeBlocks[descIndex]) {
        notebookData.sections[sectionIndex].codeBlocks[descIndex].description = descEl.textContent;
      }
    });
  });

  // 保存代码内容
  codeEditors.forEach((editor, index) => {
    const editorId = editor.getTextArea().id;
    const [_, sectionIndex, codeIndex] = editorId.split('-');
    if (notebookData.sections[sectionIndex] && notebookData.sections[sectionIndex].codeBlocks[codeIndex]) {
      notebookData.sections[sectionIndex].codeBlocks[codeIndex].code = editor.getValue();
    }
  });
  
  // 如果标题发生变化，重新渲染目录
  if (titleChanged) {
    renderToc();
  }
}

function saveNotebook() {
  saveEditableContent();
  localStorage.setItem('jsNotebook', JSON.stringify(notebookData));
  showNotification('笔记已保存！', 'success');
}

function saveNotebookData() {
  // 只保存数据，不保存可编辑内容（用于上下移动等操作）
  localStorage.setItem('jsNotebook', JSON.stringify(notebookData));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function exportHtml() {
  saveEditableContent();
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const htmlParts = [];
  
  htmlParts.push('<!DOCTYPE html>');
  htmlParts.push('<html lang="zh-CN">');
  htmlParts.push('<head>');
  htmlParts.push('<meta charset="UTF-8">');
  htmlParts.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  htmlParts.push('<title>JavaScript课堂笔记 - 导出文件</title>');
  htmlParts.push('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">');
  htmlParts.push('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css">');
  htmlParts.push('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/dracula.min.css">');
  htmlParts.push('<link rel="stylesheet" href="notes.css">');
  htmlParts.push('<style>');
  htmlParts.push('.exported-notes .sidebar { position: fixed; left: 0; top: 0; bottom: 0; z-index: 100; }');
  htmlParts.push('.exported-notes .main-content { margin-left: 280px; }');
  htmlParts.push('.exported-notes .sidebar-toggle { display: none; }');
  htmlParts.push('@media (max-width: 768px) {');
  htmlParts.push('  .exported-notes .sidebar { position: fixed; left: -280px; transition: left 0.3s ease; }');
  htmlParts.push('  .exported-notes .sidebar.active { left: 0; }');
  htmlParts.push('  .exported-notes .main-content { margin-left: 0; }');
  htmlParts.push('  .exported-notes .sidebar-toggle { display: block; position: fixed; top: 20px; left: 20px; z-index: 101; }');
  htmlParts.push('}');
  htmlParts.push('</style>');
  htmlParts.push('</head>');
  htmlParts.push('<body class="exported-notes">');
  htmlParts.push('<div class="container">');
  htmlParts.push('<header>');
  htmlParts.push('<button class="sidebar-toggle" id="sidebarToggle">');
  htmlParts.push('<i class="fas fa-bars"></i>');
  htmlParts.push('</button>');
  htmlParts.push('<div class="header-content">');
  htmlParts.push('<h1><i class="fas fa-code"></i> JavaScript课堂笔记</h1>');
  htmlParts.push('<p class="subtitle">导出时间：' + new Date().toLocaleString() + ' | 包含 ' + notebookData.sections.length + ' 个章节</p>');
  htmlParts.push('<div class="stats" style="margin-top: 15px; font-size: 0.9rem; opacity: 0.8;">');
  htmlParts.push('<span style="margin-right: 20px;"><i class="fas fa-code"></i> 代码块：' + (notebookData.sections.reduce((total, section) => total + (section.codeBlocks ? section.codeBlocks.length : 0), 0)) + ' 个</span>');
  htmlParts.push('<span><i class="fas fa-lightbulb"></i> 注意事项：' + (notebookData.sections.reduce((total, section) => total + (section.notes ? section.notes.length : 0), 0)) + ' 条</span>');
  htmlParts.push('</div>');
  htmlParts.push('</div>');
  htmlParts.push('</header>');
  htmlParts.push('<div class="content-wrapper">');
  htmlParts.push('<aside class="sidebar" id="sidebar">');
  htmlParts.push('<h2><i class="fas fa-book"></i> 课程目录</h2>');
  htmlParts.push('<ul class="toc" id="tocList">');
  notebookData.sections.forEach((section, index) => {
    htmlParts.push('<li>');
    htmlParts.push('<a href="#' + section.id + '" class="toc-link' + (index === 0 ? ' active' : '') + '" data-section-id="' + section.id + '">');
    htmlParts.push(escapeHtml(section.title || ''));
    htmlParts.push('</a>');
    htmlParts.push('</li>');
  });
  htmlParts.push('</ul>');
  htmlParts.push('</aside>');
  htmlParts.push('<main class="main-content" id="mainContent">');
  notebookData.sections.forEach((section) => {
    htmlParts.push('<section id="' + section.id + '" class="section note-section">');
    htmlParts.push('<h2><i class="fas fa-star"></i> ' + escapeHtml(section.title || '') + '</h2>');
    htmlParts.push('<p>' + escapeHtml(section.content || '') + '</p>');
    if (section.notes && section.notes.length > 0) {
      section.notes.forEach((note) => {
        htmlParts.push('<div class="note-box">');
        htmlParts.push('<strong><i class="fas fa-lightbulb"></i> 注意：</strong> ');
        htmlParts.push(escapeHtml(note.content || ''));
        htmlParts.push('</div>');
      });
    }
    if (section.codeBlocks && section.codeBlocks.length > 0) {
      section.codeBlocks.forEach((codeBlock, codeIndex) => {
        htmlParts.push('<h3><i class="fas fa-code"></i> ' + escapeHtml(codeBlock.title || '') + '</h3>');
        if (codeBlock.description) {
          htmlParts.push('<p>' + escapeHtml(codeBlock.description) + '</p>');
        }
        htmlParts.push('<div class="code-container">');
        htmlParts.push('<div class="code-header">');
        htmlParts.push('<span><i class="fas fa-code"></i> ' + escapeHtml(codeBlock.title || '示例代码') + '</span>');
        htmlParts.push('<div class="code-actions">');
        htmlParts.push('<button class="copy-code-btn" title="复制代码到剪贴板"><i class="fas fa-copy"></i> 复制代码</button>');
        htmlParts.push('<button class="run-btn" title="运行JavaScript代码"><i class="fas fa-play"></i> 运行代码</button>');
        htmlParts.push('<button class="clear-output-btn" title="清除输出结果"><i class="fas fa-eraser"></i> 清除输出</button>');
        htmlParts.push('</div>');
        htmlParts.push('</div>');
        htmlParts.push('<textarea class="code-editor" id="editor-' + section.id + '-' + codeIndex + '" style="display: none;">' + escapeHtml(codeBlock.code || '') + '</textarea>');
        htmlParts.push('<div class="output-container">');
        htmlParts.push('<div class="output-title"><i class="fas fa-terminal"></i> 输出结果：</div>');
        htmlParts.push('<div class="output-content"></div>');
        htmlParts.push('</div>');
        htmlParts.push('</div>');
      });
    }
    htmlParts.push('</section>');
  });
  htmlParts.push('</main>');
  htmlParts.push('</div>');
  htmlParts.push('<footer>');
  htmlParts.push('<p>JavaScript课堂笔记 &copy; ' + new Date().getFullYear() + '</p>');
  htmlParts.push('</footer>');
  htmlParts.push('</div>');
  htmlParts.push('<!-- 回到顶部按钮 -->');
  htmlParts.push('<button class="back-to-top" id="backToTopBtn" title="回到顶部">');
  htmlParts.push('<i class="fas fa-chevron-up"></i>');
  htmlParts.push('</button>');
  
  // 引入外部JavaScript文件
  htmlParts.push('<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js"></script>');
  htmlParts.push('<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js"></script>');
  
  htmlParts.push('<script>');
  htmlParts.push('document.addEventListener("DOMContentLoaded", () => {');
  htmlParts.push('  // 初始化CodeMirror编辑器');
  htmlParts.push('  const codeEditors = [];');
  htmlParts.push('  setTimeout(() => {');
  htmlParts.push('    document.querySelectorAll(".code-editor").forEach((textarea) => {');
  htmlParts.push('      const editor = CodeMirror.fromTextArea(textarea, {');
  htmlParts.push('        mode: "javascript",');
  htmlParts.push('        theme: "dracula",');
  htmlParts.push('        lineNumbers: true,');
  htmlParts.push('        lineWrapping: true,');
  htmlParts.push('        autoCloseBrackets: true,');
  htmlParts.push('        matchBrackets: true,');
  htmlParts.push('        indentUnit: 4,');
  htmlParts.push('        readOnly: true');
  htmlParts.push('      });');
  htmlParts.push('      codeEditors.push(editor);');
  htmlParts.push('    });');
  htmlParts.push('  }, 100);');
  htmlParts.push('  ');
  htmlParts.push('  // 侧边栏切换功能');
  htmlParts.push('  const sidebarToggle = document.getElementById("sidebarToggle");');
  htmlParts.push('  const sidebar = document.getElementById("sidebar");');
  htmlParts.push('  ');
  htmlParts.push('  if (sidebarToggle && sidebar) {');
  htmlParts.push('    sidebarToggle.addEventListener("click", () => {');
  htmlParts.push('      sidebar.classList.toggle("active");');
  htmlParts.push('      const icon = sidebarToggle.querySelector("i");');
  htmlParts.push('      if (sidebar.classList.contains("active")) {');
  htmlParts.push('        icon.className = "fas fa-times";');
  htmlParts.push('      } else {');
  htmlParts.push('        icon.className = "fas fa-bars";');
  htmlParts.push('      }');
  htmlParts.push('    });');
  htmlParts.push('    ');
  htmlParts.push('    // 点击侧边栏外部关闭侧边栏（移动端）');
  htmlParts.push('    document.addEventListener("click", (e) => {');
  htmlParts.push('      if (window.innerWidth <= 768 && ');
  htmlParts.push('          !sidebar.contains(e.target) && ');
  htmlParts.push('          !sidebarToggle.contains(e.target) && ');
  htmlParts.push('          sidebar.classList.contains("active")) {');
  htmlParts.push('        sidebar.classList.remove("active");');
  htmlParts.push('        sidebarToggle.querySelector("i").className = "fas fa-bars";');
  htmlParts.push('      }');
  htmlParts.push('    });');
  htmlParts.push('  }');
  htmlParts.push('  ');
  htmlParts.push('  // 复制功能');
  htmlParts.push('  document.querySelectorAll(".copy-code-btn").forEach(btn => {');
  htmlParts.push('    btn.addEventListener("click", function() {');
  htmlParts.push('      const container = this.closest(".code-container");');
  htmlParts.push('      const code = container.querySelector(".CodeMirror") ? ');
  htmlParts.push('        container.querySelector(".CodeMirror").CodeMirror.getValue() : ');
  htmlParts.push('        container.querySelector("textarea").value;');
  htmlParts.push('      ');
  htmlParts.push('      if (navigator.clipboard && window.isSecureContext) {');
  htmlParts.push('        navigator.clipboard.writeText(code).then(() => {');
  htmlParts.push('          showCopySuccess(this);');
  htmlParts.push('        }).catch(err => {');
  htmlParts.push('          console.error("复制失败:", err);');
  htmlParts.push('          fallbackCopyToClipboard(code, this);');
  htmlParts.push('        });');
  htmlParts.push('      } else {');
  htmlParts.push('        fallbackCopyToClipboard(code, this);');
  htmlParts.push('      }');
  htmlParts.push('    });');
  htmlParts.push('  });');
  htmlParts.push('  ');
  htmlParts.push('  // 运行代码功能');
  htmlParts.push('  document.querySelectorAll(".run-btn").forEach(btn => {');
  htmlParts.push('    btn.addEventListener("click", function() {');
  htmlParts.push('      const container = this.closest(".code-container");');
  htmlParts.push('      const output = container.querySelector(".output-content");');
  htmlParts.push('      const outputContainer = container.querySelector(".output-container");');
  htmlParts.push('      ');
  htmlParts.push('      outputContainer.style.display = "block";');
  htmlParts.push('      output.innerHTML = "";');
  htmlParts.push('      ');
  htmlParts.push('      const originalLog = console.log;');
  htmlParts.push('      console.log = function(...args) {');
  htmlParts.push('        originalLog.apply(console, args);');
  htmlParts.push('        args.forEach((arg) => {');
  htmlParts.push('          output.innerHTML += "<div>" + String(arg) + "</div>";');
  htmlParts.push('        });');
  htmlParts.push('      };');
  htmlParts.push('      ');
  htmlParts.push('      try {');
  htmlParts.push('        const code = container.querySelector(".CodeMirror") ? ');
  htmlParts.push('          container.querySelector(".CodeMirror").CodeMirror.getValue() : ');
  htmlParts.push('          container.querySelector("textarea").value;');
  htmlParts.push('        ');
  htmlParts.push('        // 确保代码在严格模式下运行');
  htmlParts.push('        const strictCode = "\'use strict\';\\n" + code;');
  htmlParts.push('        ');
  htmlParts.push('        // 创建函数并执行');
  htmlParts.push('        const result = new Function(strictCode);');
  htmlParts.push('        result();');
  htmlParts.push('        ');
  htmlParts.push('        // 如果代码执行成功但没有输出，显示成功消息');
  htmlParts.push('        if (output.innerHTML.trim() === "") {');
  htmlParts.push('          output.innerHTML = \'<div style="color: #27ae60;"><i class="fas fa-check-circle"></i> 代码执行成功（无输出）</div>\';');
  htmlParts.push('        }');
  htmlParts.push('      } catch (error) {');
  htmlParts.push('        // 详细的错误处理');
  htmlParts.push('        let errorMessage = error.message;');
  htmlParts.push('        let errorType = error.name || "错误";');
  htmlParts.push('        ');
  htmlParts.push('        // 常见错误类型的中文提示');
  htmlParts.push('        if (error instanceof SyntaxError) {');
  htmlParts.push('          errorType = "语法错误";');
  htmlParts.push('        } else if (error instanceof ReferenceError) {');
  htmlParts.push('          errorType = "引用错误";');
  htmlParts.push('        } else if (error instanceof TypeError) {');
  htmlParts.push('          errorType = "类型错误";');
  htmlParts.push('        } else if (error instanceof RangeError) {');
  htmlParts.push('          errorType = "范围错误";');
  htmlParts.push('        }');
  htmlParts.push('        ');
  htmlParts.push('        output.innerHTML = \'<div style="color: #e74c3c; padding: 10px; background: rgba(231, 76, 60, 0.1); border-radius: 5px; border-left: 4px solid #e74c3c;"><div style="font-weight: bold; margin-bottom: 5px;"><i class="fas fa-exclamation-triangle"></i> \' + errorType + \'</div><div style="font-family: monospace; font-size: 0.9em;">\' + errorMessage + \'</div></div>\';');
  htmlParts.push('      } finally {');
  htmlParts.push('        console.log = originalLog;');
  htmlParts.push('      }');
  htmlParts.push('    });');
  htmlParts.push('  });');
  htmlParts.push('  ');
  htmlParts.push('  // 清除输出功能');
  htmlParts.push('  document.querySelectorAll(".clear-output-btn").forEach(btn => {');
  htmlParts.push('    btn.addEventListener("click", function() {');
  htmlParts.push('      const container = this.closest(".code-container");');
  htmlParts.push('      const output = container.querySelector(".output-content");');
  htmlParts.push('      const outputContainer = container.querySelector(".output-container");');
  htmlParts.push('      output.innerHTML = "";');
  htmlParts.push('      outputContainer.style.display = "none";');
  htmlParts.push('    });');
  htmlParts.push('  });');
  htmlParts.push('  ');
  htmlParts.push('  // 目录导航功能');
  htmlParts.push('  document.querySelectorAll(".toc-link").forEach(link => {');
  htmlParts.push('    link.addEventListener("click", function(e) {');
  htmlParts.push('      e.preventDefault();');
  htmlParts.push('      const sectionId = this.dataset.sectionId;');
  htmlParts.push('      const targetSection = document.getElementById(sectionId);');
  htmlParts.push('      ');
  htmlParts.push('      if (targetSection) {');
  htmlParts.push('        // 计算目标位置（考虑固定头部的高度）');
  htmlParts.push('        const headerHeight = document.querySelector("header").offsetHeight;');
  htmlParts.push('        const targetPosition = targetSection.offsetTop - headerHeight - 20;');
  htmlParts.push('        ');
  htmlParts.push('        // 平滑滚动到目标章节');
  htmlParts.push('        window.scrollTo({');
  htmlParts.push('          top: targetPosition,');
  htmlParts.push('          behavior: "smooth"');
  htmlParts.push('        });');
  htmlParts.push('        ');
  htmlParts.push('        // 更新活跃状态');
  htmlParts.push('        document.querySelectorAll(".toc-link").forEach(l => l.classList.remove("active"));');
  htmlParts.push('        this.classList.add("active");');
  htmlParts.push('        ');
  htmlParts.push('        // 在移动设备上自动关闭侧边栏');
  htmlParts.push('        if (window.innerWidth <= 768) {');
  htmlParts.push('          sidebar.classList.remove("active");');
  htmlParts.push('          sidebarToggle.querySelector("i").className = "fas fa-bars";');
  htmlParts.push('        }');
  htmlParts.push('        ');
  htmlParts.push('        // 添加视觉反馈');
  htmlParts.push('        targetSection.style.borderLeftColor = "var(--accent)";');
  htmlParts.push('        targetSection.style.boxShadow = "0 8px 25px rgba(255, 215, 0, 0.3)";');
  htmlParts.push('        setTimeout(() => {');
  htmlParts.push('          targetSection.style.borderLeftColor = "";');
  htmlParts.push('          targetSection.style.boxShadow = "";');
  htmlParts.push('        }, 2000);');
  htmlParts.push('      }');
  htmlParts.push('    });');
  htmlParts.push('  });');
  htmlParts.push('  ');
  htmlParts.push('  // 回到顶部功能');
  htmlParts.push('  const backToTopBtn = document.getElementById("backToTopBtn");');
  htmlParts.push('  window.addEventListener("scroll", () => {');
  htmlParts.push('    if (window.pageYOffset > 300) {');
  htmlParts.push('      backToTopBtn.style.display = "flex";');
  htmlParts.push('    } else {');
  htmlParts.push('      backToTopBtn.style.display = "none";');
  htmlParts.push('    }');
  htmlParts.push('    ');
  htmlParts.push('    // 自动更新目录中的活跃章节');
  htmlParts.push('    updateActiveTocItem();');
  htmlParts.push('  });');
  htmlParts.push('  ');
  htmlParts.push('  backToTopBtn.addEventListener("click", () => {');
  htmlParts.push('    window.scrollTo({ top: 0, behavior: "smooth" });');
  htmlParts.push('  });');
  htmlParts.push('  ');
  htmlParts.push('  // 双击回到顶部（立即滚动，无动画）');
  htmlParts.push('  backToTopBtn.addEventListener("dblclick", () => {');
  htmlParts.push('    window.scrollTo({ top: 0, behavior: "auto" });');
  htmlParts.push('  });');
  htmlParts.push('  ');
  htmlParts.push('  // 自动更新目录活跃状态');
  htmlParts.push('  function updateActiveTocItem() {');
  htmlParts.push('    const sections = document.querySelectorAll(".note-section");');
  htmlParts.push('    const tocLinks = document.querySelectorAll(".toc-link");');
  htmlParts.push('    ');
  htmlParts.push('    if (sections.length === 0) return;');
  htmlParts.push('    ');
  htmlParts.push('    let currentSectionId = null;');
  htmlParts.push('    const scrollPosition = window.pageYOffset + 100;');
  htmlParts.push('    ');
  htmlParts.push('    sections.forEach(section => {');
  htmlParts.push('      const sectionTop = section.offsetTop;');
  htmlParts.push('      const sectionHeight = section.offsetHeight;');
  htmlParts.push('      ');
  htmlParts.push('      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {');
  htmlParts.push('        currentSectionId = section.id;');
  htmlParts.push('      }');
  htmlParts.push('    });');
  htmlParts.push('    ');
  htmlParts.push('    if (currentSectionId) {');
  htmlParts.push('      tocLinks.forEach(link => {');
  htmlParts.push('        link.classList.remove("active");');
  htmlParts.push('        if (link.dataset.sectionId === currentSectionId) {');
  htmlParts.push('          link.classList.add("active");');
  htmlParts.push('        }');
  htmlParts.push('      });');
  htmlParts.push('    }');
  htmlParts.push('  }');
  htmlParts.push('  ');
  htmlParts.push('  // 复制成功反馈');
  htmlParts.push('  function showCopySuccess(buttonElement) {');
  htmlParts.push('    const originalText = buttonElement.innerHTML;');
  htmlParts.push('    buttonElement.innerHTML = \'<i class="fas fa-check"></i> 已复制!\';');
  htmlParts.push('    buttonElement.style.backgroundColor = "#27ae60";');
  htmlParts.push('    buttonElement.style.color = "white";');
  htmlParts.push('    ');
  htmlParts.push('    setTimeout(() => {');
  htmlParts.push('      buttonElement.innerHTML = originalText;');
  htmlParts.push('      buttonElement.style.backgroundColor = "";');
  htmlParts.push('      buttonElement.style.color = "";');
  htmlParts.push('    }, 2000);');
  htmlParts.push('  }');
  htmlParts.push('  ');
  htmlParts.push('  // 传统复制方法');
  htmlParts.push('  function fallbackCopyToClipboard(text, buttonElement) {');
  htmlParts.push('    const textArea = document.createElement("textarea");');
  htmlParts.push('    textArea.value = text;');
  htmlParts.push('    textArea.style.position = "fixed";');
  htmlParts.push('    textArea.style.left = "-999999px";');
  htmlParts.push('    document.body.appendChild(textArea);');
  htmlParts.push('    ');
  htmlParts.push('    try {');
  htmlParts.push('      textArea.focus();');
  htmlParts.push('      textArea.select();');
  htmlParts.push('      const successful = document.execCommand("copy");');
  htmlParts.push('      ');
  htmlParts.push('      if (successful) {');
  htmlParts.push('        showCopySuccess(buttonElement);');
  htmlParts.push('      }');
  htmlParts.push('    } catch (err) {');
  htmlParts.push('      console.error("复制失败:", err);');
  htmlParts.push('    } finally {');
  htmlParts.push('      document.body.removeChild(textArea);');
  htmlParts.push('    }');
  htmlParts.push('  }');
  htmlParts.push('});');
  htmlParts.push('</script>');
  htmlParts.push('</body>');
  htmlParts.push('</html>');
  
  // 生成完整的HTML内容
  const htmlContent = htmlParts.join('\n');
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `javascript-notes-${timestamp}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotification('HTML文件已导出！文件名：' + a.download, 'success');
}

function showNotification(message, type) {
  const existingNote = document.querySelector('.notification');
  if (existingNote) existingNote.remove();
  const note = document.createElement('div');
  note.className = 'notification ' + (type || 'info');
  const content = document.createElement('div');
  content.className = 'notification-content';
  const icon = document.createElement('i');
  icon.className = 'fas fa-' + (type === 'success' ? 'check-circle' : 'info-circle');
  const span = document.createElement('span');
  span.textContent = message || '';
  content.appendChild(icon);
  content.appendChild(span);
  note.appendChild(content);
  document.body.appendChild(note);
  setTimeout(() => {
    note.style.opacity = '1';
    note.style.transform = 'translateY(0)';
  }, 10);
  setTimeout(() => {
    note.style.opacity = '0';
    note.style.transform = 'translateY(-20px)';
    setTimeout(() => note.remove(), 300);
  }, 3000);
}

function updateActiveTocItem() {
  // 获取所有章节元素
  const sections = document.querySelectorAll('.note-section');
  const tocLinks = document.querySelectorAll('.toc-link');
  
  if (sections.length === 0) return;
  
  // 找到当前可见的章节
  let currentSectionId = null;
  const scrollPosition = window.pageYOffset + 100; // 添加偏移量
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      currentSectionId = section.id;
    }
  });
  
  // 如果没有找到当前章节，默认选择第一个可见的
  if (!currentSectionId && sections.length > 0) {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section.offsetTop + section.offsetHeight > scrollPosition) {
        currentSectionId = section.id;
        break;
      }
    }
  }
  
  // 更新目录中的活跃状态
  if (currentSectionId) {
    tocLinks.forEach(link => {
      link.classList.remove('active');
      if (link.dataset.sectionId === currentSectionId) {
        link.classList.add('active');
      }
    });
  }
}

function toggleComment(cm) {
  // 获取当前选中的内容
  const selections = cm.getSelections();
  const cursor = cm.getCursor();
  
  if (selections.length === 1 && selections[0] === '') {
    // 没有选中内容，切换当前行注释
    toggleLineComment(cm, cursor.line);
  } else {
    // 有选中内容，切换选中区域的注释
    toggleSelectionComment(cm);
  }
}

function toggleLineComment(cm, lineNum) {
  const line = cm.getLine(lineNum);
  const trimmedLine = line.trim();
  
  if (trimmedLine.startsWith('//')) {
    // 取消注释：移除 // 和后面的空格
    const newLine = line.replace(/^(\s*)\/\/\s?/, '$1');
    cm.replaceRange(newLine, {line: lineNum, ch: 0}, {line: lineNum, ch: line.length});
  } else {
    // 添加注释：在行首添加 //
    const indent = line.match(/^\s*/)[0];
    const content = line.substring(indent.length);
    const newLine = indent + '// ' + content;
    cm.replaceRange(newLine, {line: lineNum, ch: 0}, {line: lineNum, ch: line.length});
  }
}

function toggleSelectionComment(cm) {
  const selections = cm.listSelections();
  
  selections.forEach(selection => {
    const from = selection.anchor;
    const to = selection.head;
    const startLine = Math.min(from.line, to.line);
    const endLine = Math.max(from.line, to.line);
    
    // 检查选中的行是否都已经被注释
    let allCommented = true;
    for (let i = startLine; i <= endLine; i++) {
      const line = cm.getLine(i).trim();
      if (line !== '' && !line.startsWith('//')) {
        allCommented = false;
        break;
      }
    }
    
    // 批量切换注释
    for (let i = startLine; i <= endLine; i++) {
      const line = cm.getLine(i);
      if (line.trim() !== '') { // 跳过空行
        if (allCommented) {
          // 取消注释
          const newLine = line.replace(/^(\s*)\/\/\s?/, '$1');
          cm.replaceRange(newLine, {line: i, ch: 0}, {line: i, ch: line.length});
        } else {
          // 添加注释
          const indent = line.match(/^\s*/)[0];
          const content = line.substring(indent.length);
          const newLine = indent + '// ' + content;
          cm.replaceRange(newLine, {line: i, ch: 0}, {line: i, ch: line.length});
        }
      }
    }
  });
}

function showKeyboardShortcuts() {
  // 移除现有的快捷键帮助窗口
  const existingHelp = document.querySelector('.keyboard-shortcuts-modal');
  if (existingHelp) existingHelp.remove();
  
  // 创建快捷键帮助模态窗口
  const modal = document.createElement('div');
  modal.className = 'keyboard-shortcuts-modal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-keyboard"></i> 键盘快捷键</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="shortcut-list">
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + S</span>
              <span class="shortcut-desc">保存笔记</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + N</span>
              <span class="shortcut-desc">添加新章节</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + E</span>
              <span class="shortcut-desc">导出HTML</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">F1</span>
              <span class="shortcut-desc">显示快捷键帮助</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">右下角按钮</span>
              <span class="shortcut-desc">回到顶部 (双击快速滚动)</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + /</span>
              <span class="shortcut-desc">切换代码注释 (在代码编辑器中)</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + Shift + S</span>
              <span class="shortcut-desc">显示章节统计信息</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 关闭模态窗口的事件
  const closeModal = () => modal.remove();
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
    if (e.target === modal.querySelector('.modal-overlay')) closeModal();
  });
  
  // ESC键关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  
  // 显示动画
  setTimeout(() => {
    modal.style.opacity = '1';
    modal.querySelector('.modal-content').style.transform = 'scale(1)';
  }, 10);
}

// 复制成功的视觉反馈
function showCopySuccess(buttonElement) {
  const originalText = buttonElement.innerHTML;
  const originalClass = buttonElement.className;
  
  // 临时改变按钮样式和文本
  buttonElement.innerHTML = '<i class="fas fa-check"></i> 已复制!';
  buttonElement.style.backgroundColor = '#27ae60';
  buttonElement.style.color = 'white';
  
  // 显示成功通知
  showNotification('代码已复制到剪贴板！', 'success');
  
  // 2秒后恢复原样
  setTimeout(() => {
    buttonElement.innerHTML = originalText;
    buttonElement.className = originalClass;
    buttonElement.style.backgroundColor = '';
    buttonElement.style.color = '';
  }, 2000);
}

// 传统的复制到剪贴板方法（兼容旧浏览器）
function fallbackCopyToClipboard(text, buttonElement) {
  // 创建临时的textarea元素
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  
  try {
    // 选择并复制文本
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    
    if (successful) {
      showCopySuccess(buttonElement);
    } else {
      showNotification('复制失败，请手动复制代码', 'error');
    }
  } catch (err) {
    console.error('复制失败:', err);
    showNotification('复制失败，请手动复制代码', 'error');
  } finally {
    // 清理临时元素
    document.body.removeChild(textArea);
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 辅助函数：找到当前可见的章节
function findVisibleSection() {
  const sections = document.querySelectorAll('.note-section');
  if (sections.length === 0) return -1;
  
  const scrollPosition = window.pageYOffset + 100;
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      return i;
    }
  }
  
  // 如果没有找到，返回第一个章节
  return 0;
}

// 性能优化：防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 性能优化：节流函数
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 增强的可见章节检测函数（带缓存）
let visibleSectionCache = { sectionId: null, timestamp: 0 };
const CACHE_DURATION = 100; // 100ms缓存

function findVisibleSectionEnhanced() {
  const now = Date.now();
  
  // 如果缓存仍然有效，直接返回缓存结果
  if (visibleSectionCache.sectionId !== null && 
      now - visibleSectionCache.timestamp < CACHE_DURATION) {
    return visibleSectionCache.sectionId;
  }
  
  const sections = document.querySelectorAll('.note-section');
  if (sections.length === 0) return -1;
  
  const scrollPosition = window.pageYOffset + 100;
  let currentSectionId = null;
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      currentSectionId = i;
      break;
    }
  }
  
  // 如果没有找到，返回第一个章节
  if (currentSectionId === null) {
    currentSectionId = 0;
  }
  
  // 更新缓存
  visibleSectionCache = {
    sectionId: currentSectionId,
    timestamp: now
  };
  
  return currentSectionId;
}

// 智能滚动到章节函数
function scrollToSection(sectionIndex, behavior = 'smooth') {
  if (sectionIndex < 0 || sectionIndex >= notebookData.sections.length) {
    console.warn('无效的章节索引:', sectionIndex);
    return;
  }
  
  const section = notebookData.sections[sectionIndex];
  const targetElement = document.getElementById(section.id);
  
  if (targetElement) {
    // 计算目标位置（考虑固定头部的高度）
    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
    const targetPosition = targetElement.offsetTop - headerHeight - 20;
    
    // 平滑滚动到目标章节
    window.scrollTo({
      top: targetPosition,
      behavior: behavior
    });
    
    // 更新目录中的活跃状态
    document.querySelectorAll('.toc-link').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.sectionId === section.id) {
        link.classList.add('active');
      }
    });
    
    // 添加视觉反馈
    targetElement.style.borderLeftColor = 'var(--accent)';
    targetElement.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.3)';
    setTimeout(() => {
      targetElement.style.borderLeftColor = '';
      targetElement.style.boxShadow = '';
    }, 2000);
    
    // 在移动设备上自动关闭侧边栏
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidebar');
      const sidebarToggle = document.getElementById('sidebarToggle');
      if (sidebar && sidebarToggle) {
        sidebar.classList.remove('active');
        sidebarToggle.querySelector('i').className = 'fas fa-bars';
      }
    }
  } else {
    console.warn('找不到目标章节元素:', section.id);
  }
}

// 获取章节统计信息
function getSectionStats() {
  const totalSections = notebookData.sections.length;
  const totalCodeBlocks = notebookData.sections.reduce((total, section) => 
    total + (section.codeBlocks ? section.codeBlocks.length : 0), 0);
  const totalNotes = notebookData.sections.reduce((total, section) => 
    total + (section.notes ? section.notes.length : 0), 0);
  
  return {
    totalSections,
    totalCodeBlocks,
    totalNotes,
    averageCodeBlocksPerSection: totalSections > 0 ? (totalCodeBlocks / totalSections).toFixed(1) : 0,
    averageNotesPerSection: totalSections > 0 ? (totalNotes / totalSections).toFixed(1) : 0
  };
}

// 显示章节统计信息
function showSectionStats() {
  const stats = getSectionStats();
  const message = `📊 笔记统计：共 ${stats.totalSections} 个章节，${stats.totalCodeBlocks} 个代码示例，${stats.totalNotes} 条注释`;
  showNotification(message, 'info');
}

// 优化后的滚动事件处理（使用节流）
const throttledUpdateActiveTocItem = throttle(updateActiveTocItem, 100);
const throttledScrollHandler = throttle(() => {
  // 回到顶部按钮显示/隐藏
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  }
  
  // 更新目录中的活跃章节
  throttledUpdateActiveTocItem();
}, 100);

// ==================== 数据导入导出功能 ====================

// 显示导入模态窗口
function showImportModal() {
  // 移除现有的模态窗口
  const existingModal = document.querySelector('.import-modal');
  if (existingModal) existingModal.remove();
  
  // 创建导入模态窗口
  const modal = document.createElement('div');
  modal.className = 'import-modal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-upload"></i> 导入数据</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="import-tabs">
            <button class="tab-btn active" data-tab="file">文件导入</button>
            <button class="tab-btn" data-tab="json">JSON文本</button>
            <button class="tab-btn" data-tab="merge">合并数据</button>
          </div>
          
          <div class="tab-content active" id="file-tab">
            <div class="import-section">
              <h4><i class="fas fa-file-upload"></i> 从文件导入</h4>
              <p>支持 .json 文件格式</p>
              <input type="file" id="fileInput" accept=".json" style="display: none;">
              <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
                <i class="fas fa-folder-open"></i> 选择文件
              </button>
              <div id="fileInfo" style="margin-top: 10px; display: none;"></div>
            </div>
          </div>
          
          <div class="tab-content" id="json-tab">
            <div class="import-section">
              <h4><i class="fas fa-code"></i> 从JSON文本导入</h4>
              <p>粘贴JSON数据到下面的文本框</p>
              <textarea id="jsonInput" placeholder="在此粘贴JSON数据..." rows="8" style="width: 100%; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace;"></textarea>
            </div>
          </div>
          
          <div class="tab-content" id="merge-tab">
            <div class="import-section">
              <h4><i class="fas fa-object-group"></i> 合并数据</h4>
              <p>将新数据合并到现有笔记中，而不是替换</p>
              <div class="merge-options">
                <label><input type="checkbox" id="mergeSections" checked> 合并章节</label>
                <label><input type="checkbox" id="mergeCodeBlocks" checked> 合并代码块</label>
                <label><input type="checkbox" id="mergeNotes" checked> 合并注释</label>
              </div>
            </div>
          </div>
          
          <div class="import-actions">
            <button class="btn btn-success" id="importConfirmBtn">
              <i class="fas fa-check"></i> 确认导入
            </button>
            <button class="btn btn-secondary" id="importCancelBtn">
              <i class="fas fa-times"></i> 取消
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 显示动画
  setTimeout(() => {
    modal.style.opacity = '1';
    modal.querySelector('.modal-content').style.transform = 'scale(1)';
  }, 10);
  
  // 设置事件监听器
  setupImportModalEvents(modal);
}

// 设置导入模态窗口的事件
function setupImportModalEvents(modal) {
  const closeModal = () => modal.remove();
  
  // 关闭按钮
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
    if (e.target === modal.querySelector('.modal-overlay')) closeModal();
  });
  
  // 取消按钮
  modal.querySelector('#importCancelBtn').addEventListener('click', closeModal);
  
  // 标签切换
  const tabBtns = modal.querySelectorAll('.tab-btn');
  const tabContents = modal.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      // 更新标签状态
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      modal.querySelector(`#${tabName}-tab`).classList.add('active');
    });
  });
  
  // 文件选择
  const fileInput = modal.querySelector('#fileInput');
  const fileInfo = modal.querySelector('#fileInfo');
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      fileInfo.style.display = 'block';
      fileInfo.innerHTML = `
        <div style="color: var(--success);">
          <i class="fas fa-check-circle"></i> 已选择文件: ${file.name}
          <br><small>大小: ${(file.size / 1024).toFixed(2)} KB</small>
        </div>
      `;
    }
  });
  
  // 确认导入
  modal.querySelector('#importConfirmBtn').addEventListener('click', () => {
    const activeTab = modal.querySelector('.tab-btn.active').dataset.tab;
    
    if (activeTab === 'file') {
      importFromFile();
    } else if (activeTab === 'json') {
      importFromJson();
    } else if (activeTab === 'merge') {
      importFromJson(true); // 合并模式
    }
    
    closeModal();
  });
  
  // ESC键关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// 从文件导入
function importFromFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  
  if (!file) {
    showNotification('请先选择文件', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      processImportedData(data, false);
    } catch (error) {
      showNotification('文件格式错误：' + error.message, 'error');
    }
  };
  
  reader.readAsText(file);
}

// 从JSON文本导入
function importFromJson(isMerge = false) {
  const jsonInput = document.getElementById('jsonInput');
  const jsonText = jsonInput.value.trim();
  
  if (!jsonText) {
    showNotification('请输入JSON数据', 'error');
    return;
  }
  
  try {
    const data = JSON.parse(jsonText);
    processImportedData(data, isMerge);
  } catch (error) {
    showNotification('JSON格式错误：' + error.message, 'error');
  }
}

// 处理导入的数据
function processImportedData(data, isMerge = false) {
  try {
    // 验证数据结构
    if (!data || typeof data !== 'object') {
      throw new Error('无效的数据格式');
    }
    
    if (!Array.isArray(data.sections)) {
      throw new Error('数据缺少sections数组');
    }
    
    if (isMerge) {
      // 合并模式
      mergeNotebookData(data);
      showNotification('数据已成功合并！', 'success');
    } else {
      // 替换模式
      if (confirm('这将替换所有现有数据，确定要继续吗？')) {
        notebookData = data;
        showNotification('数据已成功导入！', 'success');
      } else {
        return;
      }
    }
    
    // 清理和验证数据
    cleanupEscapedCode();
    validateAndFixSectionIds();
    
    // 保存并重新渲染
    saveNotebookData();
    renderToc();
    renderContent();
    
  } catch (error) {
    showNotification('导入失败：' + error.message, 'error');
    console.error('导入错误:', error);
  }
}

// 合并笔记数据
function mergeNotebookData(newData) {
  if (!newData.sections || !Array.isArray(newData.sections)) {
    throw new Error('新数据格式无效');
  }
  
  const mergeSections = document.getElementById('mergeSections')?.checked ?? true;
  const mergeCodeBlocks = document.getElementById('mergeCodeBlocks')?.checked ?? true;
  const mergeNotes = document.getElementById('mergeNotes')?.checked ?? true;
  
  if (mergeSections) {
    // 合并章节
    newData.sections.forEach(newSection => {
      const existingIndex = notebookData.sections.findIndex(s => s.id === newSection.id);
      
      if (existingIndex >= 0) {
        // 章节已存在，合并内容
        const existingSection = notebookData.sections[existingIndex];
        
        if (mergeNotes && newSection.notes) {
          if (!existingSection.notes) existingSection.notes = [];
          existingSection.notes.push(...newSection.notes);
        }
        
        if (mergeCodeBlocks && newSection.codeBlocks) {
          if (!existingSection.codeBlocks) existingSection.codeBlocks = [];
          existingSection.codeBlocks.push(...newSection.codeBlocks);
        }
        
        // 更新标题和内容（如果新数据更详细）
        if (newSection.title && newSection.title.length > existingSection.title.length) {
          existingSection.title = newSection.title;
        }
        if (newSection.content && newSection.content.length > existingSection.content.length) {
          existingSection.content = newSection.content;
        }
      } else {
        // 新章节，直接添加
        notebookData.sections.push(newSection);
      }
    });
  }
  
  showNotification(`成功合并 ${newData.sections.length} 个章节`, 'success');
}

// 导出笔记数据
function exportNotebookData() {
  saveEditableContent(); // 保存当前编辑的内容
  
  const exportData = {
    ...notebookData,
    exportInfo: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      totalSections: notebookData.sections.length,
      totalCodeBlocks: notebookData.sections.reduce((total, section) => 
        total + (section.codeBlocks ? section.codeBlocks.length : 0), 0),
      totalNotes: notebookData.sections.reduce((total, section) => 
        total + (section.notes ? section.notes.length : 0), 0)
    }
  };
  
  // 创建下载链接
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `javascript-notes-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('笔记数据已导出为JSON文件！', 'success');
}

// 批量导入功能
function batchImport(files) {
  if (!Array.isArray(files) || files.length === 0) {
    showNotification('请选择要导入的文件', 'error');
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (data && Array.isArray(data.sections)) {
          // 合并数据
          if (!notebookData.sections) notebookData.sections = [];
          notebookData.sections.push(...data.sections);
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`文件 ${file.name} 导入失败:`, error);
      }
      
      // 所有文件处理完成后
      if (index === files.length - 1) {
        if (successCount > 0) {
          cleanupEscapedCode();
          validateAndFixSectionIds();
          saveNotebookData();
          renderToc();
          renderContent();
          showNotification(`批量导入完成！成功: ${successCount}, 失败: ${errorCount}`, 'success');
        } else {
          showNotification('批量导入失败，请检查文件格式', 'error');
        }
      }
    };
    
    reader.readAsText(file);
  });
}

// 数据验证和清理
function validateImportedData(data) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('数据格式无效');
    return errors;
  }
  
  if (!Array.isArray(data.sections)) {
    errors.push('缺少sections数组');
    return errors;
  }
  
  data.sections.forEach((section, index) => {
    if (!section.id || typeof section.id !== 'string') {
      errors.push(`章节 ${index + 1} 缺少有效的ID`);
    }
    
    if (!section.title || typeof section.title !== 'string') {
      errors.push(`章节 ${index + 1} 缺少标题`);
    }
    
    if (section.codeBlocks && Array.isArray(section.codeBlocks)) {
      section.codeBlocks.forEach((codeBlock, codeIndex) => {
        if (!codeBlock.title || !codeBlock.code) {
          errors.push(`章节 ${index + 1} 的代码块 ${codeIndex + 1} 数据不完整`);
        }
      });
    }
  });
  
  return errors;
}