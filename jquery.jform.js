/* 


*/

/************************************************************************
* CORE jFORM                                                    *
*************************************************************************/
(function ($) {

    $.widget("nubuntu.jform", {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/
        options: {

            //Options
            actions: {},
            fields: {},
			width:"100%",
			inputWidth:"50%",
			columns:1,
			display:"create",
            animationsEnabled: true,
            defaultDateFormat: 'yy-mm-dd',
			submitButton:true,
			showTitle:true,
			showSubmit:true,
			enterNext:true,
			autoIncrement:true,
			nonew:false,
			submit:null,
            formCreated: function (event, data) { },
            formSubmitting: function (event, data) { },
            formClosed: function (event, data) { },

            messages: {
				required:'Isian ini tidak boleh kosong...',
				before_create:'Data Akan Disimpan, Lanjutkan ?',
				before_update:'Data Akan Diupdate, Lanjutkan ?',
				success_create:'Data Berhasil Disimpan',
				success_update:'Data Berhasil Diupdate',
				error_validate:'Please Fill all fields'
            }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/
        _$mainContainer: null, 
        _$form: null, 
		_$titleDiv: null,
		_$divSubmit: null, 
		_$title:null,
		_$divColumns:null,
		_$hiddenFields:[],
		_valid:{},
		_$submit:null,
		_$pkey:null,
		_pkeyname:null,

        /************************************************************************
        * CONSTRUCTOR AND INITIALIZATION METHODS                                *
        *************************************************************************/

        /* Contructor.
        *************************************************************************/
        _create: function () {
            //Creating DOM elements
			this._initFields();
            this._createMainContainer();
			this._createForm();
			this._populateForm();
			if(!this.options.submit){
				this.options.submit=this._submitForm;
			}
        },
		_populateForm:function(){
			this._createFormTitle();
			this._createColumns();
			this._createElements();
			if(this.options.enterNext){
				this._enterNext();
			}			
			this._createSubmit();
			this._createButtons();
			this._bindEvent();
			this._triggerAction();		
		},
		_bindEvent:function(){
			var self=this;
			$.each(this.options.fields,function(fieldName,field){
				self._prepareEvent(fieldName);
			});
		},
		_reload:function(){
			this._$form.empty();
			this._populateForm();	
		},
        /* Creates the main container div.
        *************************************************************************/
        _createMainContainer: function () {
            this._$mainContainer = $('<div />').width(this.options.width)
                .addClass('jform-main-container')
                .appendTo(this.element);
        },

        _createFormTitle: function () {
            var self = this;

            if (!self.options.title) {
                return;
            }
			
            var $titleDiv = $('<div />')
                .addClass('title')
				 .appendTo(self._$form);
			self._$title = $('<h2/>').append(self.options.title).appendTo($titleDiv);	 
            self._$titleDiv = $titleDiv;
        },

        _createForm: function () {
            this._$form = $('<form></form>')
                .addClass('jform')
                .appendTo(this._$mainContainer);

        },
		_createColumns:function(){
			var self=this;
			var col = self.options.columns;
			self._$divColumns = $('<div/>').addClass('jform-column')
								.addClass("jform-column-" + col)
								.appendTo(self._$form);
		},
		_initFields:function(){
			var self=this;
			$.each(self.options.fields, function (fieldName, props) {
				var field = self.options.fields[fieldName];
				field.title = props.title ? props.title : fieldName;
				field.width = props.width ? props.width : 'large';
				field.icon = props.icon ? props.icon : props.type;
				self.options.fields[fieldName]=field;
			});
		},
		_createElements:function(){
			var self=this;
			$.each(self.options.fields, function (fieldName, props) {
				if(props.list==false){
					self._createInputHidden(fieldName,props);
					return true;
				}
				self._$divColumns.append(self._createElement(fieldName,props));
			});
			
		},
		_createElement:function(fieldName,props){
			var self=this;
			var $elementDiv= self._createElementIcon(props);
			if(props.type=="group"){
				return self._createInputGroup($elementDiv,fieldName,props);
			}
			$elementDiv.append(self._createLabel(fieldName,props))
						.append(self._createInput(fieldName,props));
			return $elementDiv;	
		},
		_createElementIcon:function(props){
			var icon = props.icon;
			if(props.icon=="text"){
				icon = "input";
			}
			var $div=  $('<div/>').addClass('element-' + icon);
			if(props.type!="checkbox"){
				$div.addClass('jform-column-avoid');
			}
			return $div;
			
		},
		_createLabel:function(fieldName,props){
			if(props.type=="separator"){
				return $("<h3 class='section-break-title'>" + props.title + "</h3><hr class='separator'/>")
			}else if(props.type=="checkbox"){
				return;
			}else{
				return $("<label/>").attr("for","jform-"+ fieldName).addClass("title").append(props.title);
			}
		},
		_createInput:function(fieldName,props){
			var self=this;
			var $input=null;
			var $div = $('<div/>').addClass('item-cont jform-input').append(self._createIcon(fieldName,props));
			switch(props.type){
				case "textarea":
					$input=this._createInputTextArea(fieldName,props);
				break;
				case "date":
					$input=this._createInputDate(fieldName,props);
				break;
				case "separator":
					return;
				break;
				case "checkbox":
					return this._createInputCheckbox(fieldName,props);
				break;
				case "select":
					$input = this._createInputSelect(fieldName,props);
				break;
				default:
					$input=this._createInputText(fieldName,props);
				break
				
			}
			$input.click(function(){
				$(this).select();
			});
			if(props.key){
				$input.attr("id","pkey");
				
			}
			$div.prepend($input);			
			return $div;
		},
		_createInputText:function(fieldName,field){
			var $input = $('<input type="text" name="jform-'+ fieldName + '" id="jform-'+ fieldName + '">');
			$input = this._setWidth($input,field);
			$input = this._addProp($input,field);
			if(field.suggest){
				$input = this._bindSuggest($input,fieldName,field);
			}
			if(field.added){
				$input = this._bindAppend($input,fieldName,field);
			}
			if(field.defaultValue){
				$input.val(field.defaultValue);
			}
			return $input;
		},
		_createInputCheckbox:function(fieldName,field){
			var $input = $('<div class="column column1"><label><input type="checkbox" name="jform-' + fieldName + '" id="jform-'+ fieldName + '" value="0"><span>'+field.title+'</span></label></div>');
			//$input = this._addProp($input,field);
			$("input[type=checkbox]",$input).change(function(){
				if($(this).prop("checked")==true){
					$(this).val(1);
				}else{
					$(this).val(0);
				}
			});
			return $input;
		},
		_createInputSelect:function(fieldName,field){
			var self=this;
			var $input = $('<div/>');
			var $span = $('<span/>');
			$input = this._setWidth($input,field);
			$input = this._addProp($input,field);
			var $select = $('<select/>').attr("name","jform-" + fieldName).attr("id","jform-"+ fieldName);
			var options =[];
			if(field.source){
			if(field.source=="url"){
				$.ajax({
		        	url:field.options,
		         	async:false,
        		 	success: function(data) {
						options=eval("("+data+")");			
                  	}
    			});
			}else{
				$.ajax({
		        	url:self.options.actions.autoselectAction,
					data:{field:fieldName},
					dataType:'json',
		         	async:false,
        		 	success: function(json) {
						options=json.data;			
                  	}
    			});			
			}
			}else{
				$.each(field.options,function(key,val){
					var option={};
					option.value = key;
					option.text = val; 
					options.push(option);
				});
				
			}
			$select.append($('<option>', { value :"" }).text(""));			
			$.each(options, function(key, value) {   
     			$select.append($('<option>', { value : value.value }).text(value.text)); 
			});
			if(field.optionDefault){
				if($select.find('option[value=' + field.optionDefault +']').length){
					$select.val(field.optionDefault);
				}
			}
			$span.append($select)
					.append('<i></i><span class="icon-place"></span>')
					.appendTo($input);
			return $input;
		},		
		_createInputGroup:function($div,fieldName,field){
			var self=this;
			$div.removeClass("element-group").addClass("element-name");
			var childcount = Object.keys(field.child).length;
			var width = 100/childcount;
			var $label = self._createLabel(fieldName,field).css("text-align","center");
			$div.append($label);
			$.each(field.child,function(key,value){
				var $span = $('<span/>').addClass("nameLast").width(width + "%")
							.append(self._createLabel(key,value));
				var $input = self._createInputText(key,value);			
				$input = self._addProp($input,field);
				$span.append($input).appendTo($div);				
				
			});
			return $div;
		},
		_createInputDate:function(fieldName,field){
			var dateFormat = field.displayFormat ? field.displayFormat : this.options.defaultDateFormat; 
			var $input = $('<input type="text" name="jform-'+ fieldName + '" id="jform-'+ fieldName + '">');
			$input.datepicker({
				changeMonth: true,
				changeYear: true,
				dateFormat:"yy-mm-dd"
			}); 
			$input = this._setWidth($input,field);
			$input = this._addProp($input,field);
			if(field.defaultValue){
				$input.val(field.defaultValue);
			}
			return $input;   
		},
		_createInputTextArea:function(fieldName,field){
			$input = $('<textarea name="jform-'+ fieldName + '" id="jform-'+ fieldName + '"/>');
			$input = this._setWidth($input,field);
			$input = this._addProp($input,field);
			return $input;
		},
		_createInputHidden:function(fieldName,field){
			var $input = $('<input type="hidden" name="jform-'+ fieldName + '" id="jform-'+ fieldName + '">');
			if(field.key){
				self._$pkey=$input.attr("id","pkey");
			}

			this._$hiddenFields.push($input);
		},
		_createIcon:function(fieldName,props){
			return $('<span class="icon-place"></span>');		
		},
		_createHidden:function(){
			var self=this;
			var $hidden = self._$hiddenFields;
			if($hidden.length>=1){
				for(var i=0;i<$hidden.length;i++){
					self._$form.append($hidden[i]);
				}
			}
		},
		_createSubmit:function(){
			var self=this;
			self._$divSubmit = $('<div/>').addClass("submit");
			if(self.options.submitButton){
				self._$submit=$('<input type="submit" value="Submit">').appendTo(self._$divSubmit);
			}
			self._$form.append(self._$divSubmit);
			self._createHidden();
		},
		_setWidth:function($input,field){
			if(field.width=="small" || field.width=="medium" || field.width=="large"){
				$input.addClass(field.width);
			}else{
				$input.css("width",field.width);
			}
			return $input;
		},
		_addProp:function($input,field){
			$input.prop("readonly",field.readonly)
				  .prop("disabled",field.disabled)
  				  .prop("required",field.required);
			return $input; 									
		},
		_bindAppend:function($input,fieldName,field){
			var self=this;
			var props = field;
			console.log($input);
			$input.change(function(){
						console.log("nnnn");
							$.ajax({
		         				url:self.options.actions.autoappendAction,
		         				data:{field: fieldName,keyword:$input.val()},
								async:false,
        		 				success: function(response) {
									
									try{
										var json=$.parseJSON(response);
									}catch(e){
										console.log(e);
										return;
									}
									console.log(props);
									for(var i=0;i<props.added.added.length;i++){
										console.log(props.added.added[i]);
										self._$form.find("#jform-" + props.added.added[i])
											.val(eval("json." + props.added.display[i]));
									}
                  				}
    						});    						
		
					});
			return $input;
		},
		_bindSuggest:function($input,fieldName,field){
			var self=this;
			var props = field;
			this._$hiddenFields.push($('<input type="hidden" name="jform-'+ fieldName + '-id"/>'));
			$input.dblclick(function(){
				var $inputid=$("input[name=" + $input.attr('name') + "-id]");
				
				if($inputid.val().trim()==$(this).val().trim()){
					if($(this).val().trim().length>=1){
							$.ajax({
		         				url:self.options.actions.autosuggestAction,
		         				data:{field: fieldName,keyword:$input.val(),single:true },
								async:false,
        		 				success: function(response) {
									var json=$.parseJSON(response);
									var $inputid=$("input[name=" + $input.attr('name') + "-id]");
									$inputid.val( json.id );
									$input.val(json.value);
									if(props.suggest.added){
									$.each(props.suggest.added,function(key,value){
										$("input[name=jform-" + value + "]").val(eval("json." + value));
									});
									}
                  				}
    						});    						
					}
				}
			
			});
			$input.autocomplete({
				minLength: 3,
    			source: function( request, respond ) {
       				$.post(self.options.actions.autosuggestAction, 
					{field: fieldName,keyword:$input.val() },
            		function( response ) {
							json=JSON.parse(response);
                			respond(json);
        			});
    			},
				select: function( event, ui ) {
					var $inputid=$("input[name=" + $input.attr('name') + "-id]");
					$inputid.val( ui.item.id );
					if(props.suggest.added){
					$.each(props.suggest.added,function(key,value){
						$("input[name=jform-" + value + "]").val(eval("ui.item." + value));
					});
					}
				},
    			change: function (event, ui) {
					
					var $inputid=$("input[name=" + $input.attr('name') + "-id]");
					if($inputid.val().trim().length<1){
        			if ( !ui.item){
						/**
						if($input.val().trim().length>=3){
       						$.post(self.options.actions.autosuggestAction, 
								{field: fieldName,keyword:$input.val() },
            					function( response ) {
									var json=$.parseJSON(response);
									json = json[0];
									var $inputid=$("input[name='" + $input.attr('name') + "-id'");
									$inputid.val( json.id );
									$input.val(json.value);
									if(props.suggest.added){
									$.each(props.suggest.added,function(key,value){
										$("input[name='jform-" + value + "'").val(eval("json." + value));
									});
									}
                					
        					});
						}
						**/
					}else{
			       		$input.val("");
						$inputid.val("");
						if(props.suggest.added){
						$.each(props.suggest.added,function(key,value){
							$("input[name=jform-" + value + "]").val("");
						});
						}

				    }
					}
    			}				
			});
			return $input;
		},
		load:function(data){
			var data=data!=undefined?data:{};
			this._validate();
			if(this.options.display=='edit'){
				this._prepareData(data);
			}else{
				this._prepareValue();
			}
		},
		_prepareData:function(data){
			var self=this;
			var data = data!=undefined?data:{};
			var loading = $.msgLoading().dialog('open');
			$.ajax({url:self.options.actions.listAction,
				data:data,
				success:function(data){
				var json = $.parseJSON(data);
				
				$.each(json.Records[0],function(fieldName,value){
					if(self.options.fields[fieldName]){
					self.options.fields[fieldName].value=value;
					if(self.options.fields[fieldName].suggest){
						$("input[name=jform-" + fieldName + "-id]").val(value);
						$("*[name='jform-" + fieldName + "']").val(value).dblclick();
					}else if(self.options.fields[fieldName].type=="checkbox"){
						if(value=="0" || value==0 || value=="" || value==null){
							 $("*[name='jform-" + fieldName + "']").val(value).prop("checked",false).change();
						}else{
							 $("*[name='jform-" + fieldName + "']").val(value).prop("checked",true).change();							
						}
					}else{
						$("*[name='jform-" + fieldName + "']").val(value).change();
					}
					self._prepareEvent(fieldName);
					}
				});
				loading.dialog('close');
			 }
			});
			
		},
		_prepareValue:function(){
			var self=this;
				$.each(self.options.fields,function(fieldName,field){
					
					if(field.value){
					var value = field.value;
					if(field.suggest){
						$("input[name=jform-" + fieldName + "-id]").val(value);
						$("*[name='jform-" + fieldName + "']").val(value).dblclick();
					}else if(field.type=="checkbox"){
						if(value=="0" || value==0 || value=="" || value==null){
							 $("*[name='jform-" + fieldName + "']").val(value).prop("checked",false).change();
						}else{
							 $("*[name='jform-" + fieldName + "']").val(value).prop("checked",true).change();							
						}
					}else{
						$("*[name='jform-" + fieldName + "']").val(value).change();
					}
					}
					self._prepareEvent(fieldName);
				});
								
		},
		_prepareEvent:function(fieldName){
			var self=this;
			
			if(self.options.fields[fieldName].change){
				var basechange = $("*[name='jform-" + fieldName + "']").change;
				$("*[name='jform-" + fieldName + "']").change(function(){
					self.options.fields[fieldName].change(self,$(this));
				});
			}
			if(self.options.fields[fieldName].keydown){
				var basekeydown = $("*[name='jform-" + fieldName + "']").keydown;
				$("*[name='jform-" + fieldName + "']").bind("keypress",function(e){
					self.options.fields[fieldName].keydown(self,$(this),e);

				});
			}
			
		},
		_getAction:function(){
			this._$pkey = this._$form.find("#pkey");
			this._pkeyname=this._$pkey.attr("id");	
			var $pkey=this._$pkey.val();
		
			var action='create';
			if(this.options.autoIncrement){
				action = $pkey=='' || $pkey.length<1  ? 'create' : 'update';
			}
			return action;
		},
		_enterNext:function(){
	       var _i =0;
		   var self=this;
		   var $form=this._$form;
    	   $('input[type=text], textarea, select',$form).each(function(index){
    			_i = index;
				if($(this).prop("readonly")==true || $(this).prop("disabled")==true){
					return;
				}
            	$(this).addClass('tab'+index).keydown(function(event){
                    if(event.keyCode==13){
						var fname=$(this).attr("name").replace("jform-","");
						if(self.options.fields[fname].keydown){
							self.options.fields[fname].keydown(self,$(this),event);
						}else{
						$('.tab'+(index+1)).focus();
                        event.preventDefault();
						}
                    }
                });
		   });
        },
		_isValid:function(){
			var self=this;
		   var $form=this._$form;
		   var stat=true;
    	   $('input[type=text], textarea, select',$form).each(function(index){
    			if($(this).prop("required")){

					var $div = $(this).closest('.item-cont');
					if($(this).val()=="" || $(this).val().trim().length<1){
						$div.addClass("error-field");
						$(this).addClass("error-label");
						$(this).attr("placeholder",self.options.messages.required);
						eval("self._valid." + $(this).attr("name").replace("jform-","") +"=false");
						stat= false;
					}else{	
						$div.removeClass("error-field");
						$(this).removeClass("error-label");
						$div.remove('label.error');
						eval("self._valid." + $(this).attr("name").replace("jform-","") +"=true");
					}
			}
		   });
		   return stat;
		},
		_validate:function(){
			var self=this;
		   var $form=this._$form;
    	   $('input[type=text], textarea, select',$form).each(function(index){
    			if($(this).prop("required")){
				$(this).blur(function(){
					var $div = $(this).closest('.item-cont');
					if($(this).val()=="" || $(this).val().trim().length<1){
						$div.addClass("error-field");
						$(this).addClass("error-label");
						$(this).attr("placeholder",self.options.messages.required);
						eval("self._valid." + $(this).attr("name").replace("jform-","") +"=false");
					}else{	
						$div.removeClass("error-field");
						$(this).removeClass("error-label");
						$div.remove('label.error');
						eval("self._valid." + $(this).attr("name").replace("jform-","") +"=true");
					}
				});
				$(this).change(function(){
					$(this).blur();
				});
			}
		   });
			$form.submit(function(e){
				e.preventDefault();
					$.msgConfirm({
						msg:self.options.display=="edit"?self.options.messages.before_update:self.options.messages.before_create,
						CANCEL:function(){
							return false;
						},
						OK:function(){
							self.options.submit(self);
							if(self.options.afterSubmit){
								self.options.afterSubmit(self);
							}
						}
					});
			});
		},
		_getError:function($input){
				$input.attr("placeholder",self.options.messages.required);
		},
		_getFormData:function(){
			var self=this;
			var $form = this._$form;
					$form.find("*[required]").each(function(index, element) {
    					$(this).change();
                    });
					if(Object.keys(self._valid).length>=1){
						$.each(self._valid,function(key,val){
							if(val!=true){
								alert(self.options.messages.error_validate);
								return false;
							}
						});
					}
					var data = $form.serializeArray();
					for(var i=0;i < data.length;i++){
						var clearname = data[i].name.replace("jform-","");
						if(self.options.fields[clearname]){
						if(self.options.fields[clearname].suggest){
							data[i].value = $form.find("input[name=" + data[i].name + "-id]").val();	
						}
						data[i].name = data[i].name.replace("jform-","");
						}
					}
					$form.find("input:checkbox:not(:checked)").each(function(index, element) {
						var input = {}
						input.name=$(this).attr("name").replace("jform-","");
						input.value=0;
						data[i]=input;
						i++;
                    });
			return $.param(data);		
		},
		_submitForm:function(self){
			var $form = self._$form;
					var $pkey = $("#pkey").val().trim();
					var action="create";
					console.log(self.options);
					if(self.options.autoIncrement){
						action = $pkey=="" || $pkey.length<1  ? "create" : "update";
					}
					var success_msg = eval("self.options.messages.success_" + action);
					var data = self._getFormData();
					var loading=$.msgLoading().dialog('open');
					$.ajax({url:eval("self.options.actions." + action + "Action"),data:data,
						success:function(respon){
							var json = $.parseJSON(respon);
							loading.dialog('close');
							if(json.Result=='OK'){
								var action = self.options.display=="edit" ? "update" : "create";
								if(self.options.nonew){
									alert(eval("self.options.messages.success_" + action));
									return;
								}
								$.msgConfirm({
									msg:eval("self.options.messages.success_" + action) + ', input baru lagi?',
									OK:function(){
										self._reload();
										return;
									}									
								});
								if(action=="create"){
									var pkey = $("#pkey").attr("name").replace("jform-","");
									var record = json.Record;
									$("#pkey").val(eval("record." + pkey));
								}								
							}else{

							}
						}
					});

		},
		_createButtons:function(){
			var self=this;
			if(this.options.buttons){
				$.each(this.options.buttons,function(key,val){
					//console.log(val);
					val.title=val.title!=undefined?val.title:key;
					var $button = $("<input/>").attr("type","button").attr("id",key).addClass("jform-button")
									.val(val.title)
									.click(function(e){
										val.click(self,$(this),e);			
									})
									.load(function(e){
										val.load(self,$(this),e);			
									})
									.prependTo(self._$divSubmit);
				});
			}
		},
		_triggerAction:function(){
			if(!this.options.showTitle){
				this._$titleDiv.hide();
			}
			if(!this.options.showSubmit){
				this._$divSubmit.hide();
				this._$submit.remove();
			}
		},
		_getFullOptions:function($dlg,newwin,url){
			var self=this;
			newwin = typeof newwin !== 'undefined' ? newwin : false;
			$dlg = typeof $dlg !== 'undefined' ? $dlg : false;

			if(newwin){
			   var newBtn = $('<div class="ui-dialog-titlebar-buttonpane" style="position: absolute; top: 50%; right: 8em; margin-top: -10px; height: 18px;"><a class="ui-dialog-titlebar-newwin ui-corner-all ui-state-default" href="#" role="button" title="New Window"><span class="ui-icon ui-icon-newwin">newwindow</span></a></div>'
			   );
			   newBtn.click(function(){
				  	var link = url===undefined?$dlg.find('iframe').attr("src"):url;
					var win = window.open(link, '_blank');
					if(win){
					    win.focus();
					}else{
					    alert('Please allow popups for this site');
					}					
				   $dlg.dialog('close');
			   });
			}else{
				var newBtn = $('<div/>');
			}
			var option = {
		         "create": function() {    ///// CREATE FUNCTION TO ADD CUSTOM BUTTON
            		$(this).prev('.ui-dialog-titlebar').find('.ui-dialog-title').after(newBtn);
            	},		
        "closable" : true,
        "maximizable" : true,
        "minimizable" : true,
        "collapsable" : true,
        "dblclick" : "collapse",
        "titlebar" : "transparent",
        "minimizeLocation" : "right",
        "icons" : {
          "close" : "ui-icon-closethick",
          "maximize" : "ui-icon-arrow-4-diag",
          "minimize" : "ui-icon-minus",
          "collapse" : "ui-icon-triangle-1-s",
          "restore" : "ui-icon-bullet"
        },
        "load" : function(evt, dlg){},
        "beforeCollapse" : function(evt, dlg){},
        "beforeMaximize" : function(evt, dlg){},
        "beforeMinimize" : function(evt, dlg){},
        "beforeRestore" : function(evt, dlg){},
        "collapse" : function(evt, dlg){},
        "maximize" : function(evt, dlg){},
        "minimize" : function(evt, dlg){},
        "restore" : function(evt, dlg){}				
			}
			return option;
		},   
		_popUp:function(el,options){
			var self=this;
			var $dialog = $('<div></div>').addClass("popupwin").css('overflow', 'hidden')
               .html('<iframe style="border: 0px; " src="' + el.data("url") + '" width="100%" height="100%"></iframe>')
               .dialog($.extend(true,{
                   autoOpen: false,
                show: self.options.dialogShowEffect,
                hide: self.options.dialogHideEffect,
                minWidth:350,
				height:600,
				maxHeight:620,
				width: 940,
                modal: false,
                   title: el.attr("title")			
               },options));
			   var option = this._getFullOptions($dialog,true);
      		$dialog.dialogExtend(option);
 
			$dialog.dialog('open');		
		},


    });

}(jQuery));