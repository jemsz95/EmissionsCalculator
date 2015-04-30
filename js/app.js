(function() {
    var app = angular.module('emisionsCalculator', ['ngResource']);

    app.controller('CaculatorCtlr',['$scope', '$http', function($scope, $http) {
        $scope.data = [];
        $scope.sections = [];
        $scope.completedSectionsIds = [];
        $scope.isFull = false;
        $scope.isDirty = false;

        $scope.sections = $scope.data.sections;

        $http.get('/appData.json').
            success(function(data, status, headers, config) {
                $scope.data = data;
                $scope.sections = $scope.data.sections;
            }).
            error(function(data, status, headers, config) {
                console.log("AJAX Error");
        });

        $scope.calculate = function() {
            var result = $scope.calculator.result;
            result = 0;

            angular.forEach($scope.sections, function(value, key, obj){
                result += value.result;
            });
        }

        $scope.$on('sectionCalculationComplete', function(e, wasDirty) {
            if(wasDirty) {
                $scope.isDirty = true;

                if($scope.completedSectionsIds.indexOf(e.targetScope.section.id) === -1) {
                    //First time section has been answered
                    $scope.completedSectionsIds.push(e.targetScope.section.id);
                }
            }

            if($scope.completedSectionsIds.length === $scope.sections.length) {
                //Section is full
                $scope.calculate();
            }
        });
    }]);


    app.controller('SectionCtlr', function($scope) {
        $scope.questionModifiers = angular.copy($scope.$parent.data.factors);
        $scope.completedQuestionsIds = [];
        $scope.isDirty = false;

        $scope.calculate = function() {
            if($scope.isDirty) {
                var result = $scope.section.result;
                result = 0;

                angular.forEach($scope.section.questions, function(value, key, obj){
                    result += value.result;
                });
            }

            $scope.$emit('sectionCalculationComplete', $scope.isDirty)

            $scope.isDirty = false;
        }

        $scope.$on('questionCalculationComplete', function(e, wasDirty) {
            if(wasDirty) {
                $scope.isDirty = true;

                if($scope.completedQuestionsIds.indexOf(e.targetScope.question.id) === -1) {
                    //First time question has been answered
                    $scope.completedQuestionsIds.push(e.targetScope.question.id);
                }
            }

            if($scope.completedQuestionsIds.length === $scope.section.questions.length) {
                //Section is full
                $scope.calculate();
            }
        });

        $scope.$on('mustCheckSiblingDependencies', function(e, id) {
            //Executes all calculations that depend on the given question
            $scope.$broadcast('mustCheckDependencies', id);
        });

        $scope.$on('waitForDependancy', function(e, dependantScope, dependancyId) {
            //Execute if dependancy is ready. Ignore if not.
            //(The actual calculation will be done when the mustCheckDependencies broadcast is recieved)
            if($scope.completedQuestionsIds.indexOf(dependancyId) !== -1) {
                dependantScope.calculate();
            }
        });
    });


    app.controller('QuestionCtlr', function($scope) {
        $scope.isDirty = true;
        $scope.isEmpty = true;
        $scope.answer = 0;
        $scope.questionExec = new Function('vars', 'answer', '$scope', $scope.question.exec);

        $scope.calculate = function() {
            if($scope.isDirty) {
                $scope.question.result = $scope.questionExec($scope.$parent.questionModifiers, $scope.answer);

                if($scope.question.result == -1) {
                    $scope.$emit('mustCheckSiblingDependencies', $scope.question.id);
                }
            }

            $scope.$emit('questionCalculationComplete', $scope.isDirty);

            $scope.isDirty = false;
        }

        $scope.answerChange = function() {
            $scope.isDirty = true;
            $scope.isEmpty = false;

            if($scope.question.requires != 0) {
                //Question depends on another
                $scope.$emit('waitForDependency', $scope, $scope.question.requires);
            } else {
                //Question has no dependancies
                $scope.calculate();
            }
        }

        $scope.$on('mustCheckDependencies', function(e, id) {
            if($scope.question.requires == id) {
                $scope.isDirty = true;

                if(!$scope.isEmpty) {
                    $scope.calculate();
                }
            }
        });

        $scope.$on('forceRecalculate', function() {
            $scope.answerChange();
        });
    });
})();
